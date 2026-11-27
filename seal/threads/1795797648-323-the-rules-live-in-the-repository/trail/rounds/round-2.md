# Review round 2: 1795797648-323-the-rules-live-in-the-repository

```seal
target: 6fde83a8, fixes 8d4d65ea..6fde83a8
```

This is a verifying round. Its code is the fix diff `8d4d65ea..6fde83a8`: the crafter's commits `d3f3c26b` through `24f2b4e9`, the orchestrator's `6b0b5aa0` and `6fde83a8`, and `8fdeac8c`, which records round 1's close blocks. The base is `release/v0.2.0`. `git ls-remote` shows it at `aec3e8ac` on `origin`, the same commit as `main`, and `gh pr list --base release/v0.2.0 --state all` returns no pull request. The work item has no frame. Read whole at the target: `routing.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` and `trail/rounds/round-1.md`. `seal/config.json` sets `Commit and pull request language` to English, so no `pr.<lang>.md` is owed. No `seal/parity.json` is declared.

Carried from round 1 and not re-established: the orchestrator's merged table as the plan, the "already in tree" reads of rules 1, 3, 11, 14, 15, 18, 19, 22, 24, 37 and 38, the open-issue search of `gaps.md:12`, the rulesets, the `owner runs` label, and the anchors `CLAUDE.md:7-11` link to. The fix diff changes none of those headings, files or settings.

## Findings

### 1. `routing.md` records the number 0.2.0 as the orchestrator's decision, under owner's words that delegate the merge, though the roadmap gives the number's approval to the owner

```seal
severity: should
location: `seal/threads/1795797648-323-the-rules-live-in-the-repository/routing.md:29`, `seal/threads/1795797648-323-the-rules-live-in-the-repository/changelog.md:9`, `apps/desktop/package.json:3`
evidence: executed `git grep -n -F "0.2.0" -- CLAUDE.md docs README.md README.ko.md apps/desktop/package.json seal/threads/1795797648-323-the-rules-live-in-the-repository`; read `docs/roadmap.md:84`, `docs/roadmap.md:86`, `docs/architecture.md:334`, `seal/threads/1795797648-323-the-rules-live-in-the-repository/routing.md:29`
regression: round-1#1
```

Why it matters: the unit is the bullet *Base and version* at `routing.md:29`, which the orchestrator's `6b0b5aa0` added. The work item has no frame. `routing.md` *Why this way* stands for the plan, and round 1's finding 1 asked the routing to name the base and the version move as decided. The fix named both, as the roadmap asks. It also wrote the number as "decided by the orchestrator on 2026-11-28 under the owner's delegation ("머지도 너가정해")", and the defect comes from that grounding. `docs/roadmap.md:84` says: "The orchestrator proposes the number with its grounds, and the owner approves it, when the release branch is cut until issue #279 lands". `docs/roadmap.md:86` repeats it for the cut: "the orchestrator proposes the number when it cuts the branch ... and the owner approves it then". `docs/architecture.md:334` names an approval among what goes to the person under `agentic`. The quoted words read "you decide the merge too". They name the merge, and they do not name the number. So the record shows a proposal with its grounds and no approval. A sealer that reads `routing.md:29` against `docs/roadmap.md:86` cannot tell whether the owner approved 0.2.0, or whether the version move rests on the orchestrator alone. That is the version `apps/desktop/package.json:3` now carries, and `changelog.md:9` states it for the release note. This round did not see the conversation the quote comes from, so the owner may have approved the number in other words. In that case the record lacks only those words. The search printed `apps/desktop/package.json:3`, `changelog.md:9` and `routing.md:29`. It is a sample.

Where the owner's words that approve 0.2.0 exist, quote them in `routing.md:29`, as `CLAUDE.md:17` asks of a delegation:

```markdown
- **Base and version, 2026-11-28:** the orchestrator proposed 0.2.0, a minor move by `docs/roadmap.md` *Releases and the tracker*: the work of the milestone `direction: composable workflows and shared rules` brings a workflow a person composes and the rename to IADD, which a person feels. The owner approved the number on <date> ("<the owner's words, verbatim>"), and delegated the merge ("머지도 너가정해"). The branch `release/v0.2.0` was cut from `main` at `aec3e8ac`, and this pull request merges into it by squash. It is the release's first pull request, so it moves the version: `apps/desktop/package.json` to 0.2.0. This repository's `.github/workflows/owlery-seal.yml` keeps its pin at `v0.1.0`, because this repository keeps the AgenticSeal plugin's forms until the plugin takes IADD's names (#322 *When it lands*, step 4).
```

Where they do not exist, the number goes to the owner as the one approval `docs/architecture.md:334` sends to a person, before the pull request merges. The bullet then says that the number is proposed and that the approval is owed. If the owner names another number, `apps/desktop/package.json:3` and `changelog.md:9` change with it, and a round reads that commit.

### 2. At 0.2.0 the app offers this repository the move of its check to Owlery 0.2.0, the pin raise that the routing defers to #322, and no record names the offer

```seal
severity: should
location: `seal/threads/1795797648-323-the-rules-live-in-the-repository/routing.md:29`, `seal/threads/1795797648-323-the-rules-live-in-the-repository/changelog.md:9`
evidence: executed `git grep -n -F "v0.1.0" -- seal/threads/1795797648-323-the-rules-live-in-the-repository CLAUDE.md docs`; read `apps/desktop/build.mjs:27`, `apps/desktop/src/daemon/daemon.ts:3069`, `apps/desktop/src/daemon/records-place.ts:222-232`, `apps/desktop/src/daemon/records-place.ts:453-455`, `apps/desktop/src/renderer/sidebar.ts:122-130`, `apps/desktop/src/renderer/sidebar.ts:217`, `apps/desktop/test/view.test.ts:5458-5479`, `.github/workflows/owlery-seal.yml:33-38`, issue #322 *When it lands* step 4
regression: round-1#1
```

Why it matters: the unit is the version move in `apps/desktop/package.json:3` (`d3f3c26b`), with the sentences about the pin that stay at `routing.md:29` (`6b0b5aa0`) and `changelog.md:9` (`d3f3c26b`). The work item has no frame. Round 1's finding 1 asked for the version move, and the fix made it, as `docs/roadmap.md:86` gives it. The defect comes from a call that the move puts into effect for this repository. `apps/desktop/build.mjs:27` builds the package's version into the daemon as `OWLERY_VERSION`. `daemon.ts:3069` reads each repository with `readRecordsPlace(folder, this.options.version)`, and `records-place.ts:231-232` sets `olderCheck` wherever the pin in `owlery-seal.yml` is older than the app's version. `sidebar.ts:217` then puts a button on that repository's row. The button opens the records place dialog, where `records-place.ts:453-455` plans the commit that writes the workflow whole for the app's version. `view.test.ts:5458-5479` pins that dialog's words: the workflow "fetches the pull request check of Owlery 0.0.4, older than this app", and the commit moves the check up. In a build from this branch, Owlery's own repository is such a repository, since its `owlery-seal.yml:36-38` pins `v0.1.0`. So the owner's app offers the raise that #322 *When it lands* step 4 defers: "Until the plugin takes IADD's names, this repository keeps `seal/` and that pin ... Once the plugin takes the names, the migration and the raised pin go in one commit." A commit taken from the offer pins `v0.2.0`. That tag does not exist yet, so the check is cloned from the head of `release/v0.2.0`. Once #322's rename merges there, the check reads IADD's forms, and this repository's `seal/` records fail it. `routing.md:29` and `changelog.md:9` state that the pin stays, and neither says that the app will offer to move it. A record that the settle removes is also no place a person reads at the button. By `docs/roadmap.md:97`, a decision that shapes an open issue goes into that issue's body. The rename's frame under #322 reads that body when it designs the migration of a connected repository. The search printed `routing.md:29` alone. It is a sample.

For `routing.md`, after the sentence about the pin at `routing.md:29`:

```markdown
  From this pull request on, a build of the app is at 0.2.0, so its sidebar offers this repository the move of `owlery-seal.yml` to Owlery 0.2.0 (`apps/desktop/src/daemon/records-place.ts#readRecordsPlace`). The offer is not taken here until #322 *When it lands* step 4, and the orchestrator adds that to #322's body, as `docs/roadmap.md` *Releases and the tracker* says a decision that shapes an open issue does.
```

For `changelog.md:9`, the second sentence gains a clause:

```markdown
This repository's own pull requests are still checked by Owlery's check at 0.1.0, which `.github/workflows/owlery-seal.yml` pins, until the AgenticSeal plugin takes IADD's names (#322), and the app's offer to move that pin is not taken here before then.
```

The note in #322's body is the orchestrator's act, outside the branch. The fix pass names it in its answer, and no round reads it.

## Confirmations

```seal
confirms: round-1#1
```
What holds: `routing.md:29` names the base (`release/v0.2.0`, by squash), says the pull request is the release's first, and says it moves the version. `apps/desktop/package.json:3` reads `"version": "0.2.0"` at the target, and `changelog.md:9` states it. The move is the release's version move as `docs/roadmap.md:86` gives it: "every pull request of the release merges into it. The first of those pull requests moves the version". Executed: `git ls-remote origin 'refs/heads/release/*' 'refs/tags/v0.1.0'` shows `release/v0.2.0` at `aec3e8ac` and the tag `v0.1.0`. `gh pr list --state all --base release/v0.2.0` returns no pull request, so no other pull request has moved the version first. The move of 0.1.0, in `7c6cba4a`, changed `apps/desktop/package.json` and the pin of `owlery-seal.yml` together (`git show 7c6cba4a`). This move leaves the pin, and `routing.md:29` grounds that on #322's body *When it lands* step 4, which reads "Until the plugin takes IADD's names, this repository keeps `seal/` and that pin" (read, `gh issue view 322`). So the pin staying is stated and grounded. `git grep -n -F "0.1.0" -- ':!*.md' ':!pnpm-lock.yaml'` printed `owlery-seal.yml:33-38` and synthetic test inputs, examples and comments, which the fix pass's answer names, and `pnpm-lock.yaml` holds no version for the workspace package. So the move left no other statement of the app's version. The value 0.2.0 in `routing.md:29` and `changelog.md:9` is written by this work item's own commit to the version file, so contract rule 19 lets it stand. The approval of the number and the app's offer to raise the pin are this round's findings 1 and 2, which name this finding on their `regression:` lines.

```seal
confirms: round-1#2
```
What holds: `docs/roadmap.md:47` reads "What a release holds is read from what has merged into its branch, and what a milestone holds is counted on GitHub, not from these tables". `docs/roadmap.ko.md:47` says the same, and `changelog.md:6` carries the corrected clause. The new sentence agrees with the paragraph's opening ("A release holds what has merged when it is cut") and with `docs/roadmap.md:58`. Executed: `git grep -n -i -E "counted from its|GitHub milestone, not" -- docs CLAUDE.md README.md` and the work item's records outside `trail/`, which prints nothing.

```seal
confirms: round-1#3
```
What holds: `CLAUDE.md` holds no `handoff.md` rule. Executed: `git grep -n -F "handoff" -- CLAUDE.md docs`, which prints nothing. `gaps.md:5` drops rule 10 from what was written, `gaps.md:24` lists it among the plugin's practices, and `routing.md:25` reads "`handoff.md` is the plugin's practice ... so nothing is written here". `changelog.md:5` and its process row name no `handoff.md`. `pr.md:3` copies `gaps.md:5` word for word (executed: a string comparison of the two lines). `trail/phases/phase-1.md:19` still lists rule 10 among what phase 1 wrote. That is the phase's account of its own commit, and it holds of that commit. `gaps.md` states the present.

```seal
confirms: round-1#4
```
What holds: `CLAUDE.md:16` pushes only "Where `Destination` reads `open the pull request`". It says that a push starts none of the four workflows only for a branch that has no pull request, and that "a push to an open pull request's branch is one of" a pull request's events. Executed: `ls .github/workflows` lists `check.yml`, `owlery-seal.yml`, `package.yml` and `rerun-unstarted.yml`, which are the four the bullet names. `awk` over each `on:` block shows `pull_request` for the first two (with `synchronize` among `owlery-seal.yml`'s types), tags and `workflow_dispatch` for `package.yml`, and `workflow_run` for `rerun-unstarted.yml`. The bullet adds an obligation to the plugin's permission ("push the branch as often as you like", `skills/code-review/orchestration.md:295` of AgenticSeal 0.39.3), so it does not restate the plugin. `changelog.md:5` and its process row carry the same condition.

```seal
confirms: round-1#5
```
What holds: `CLAUDE.md:3` now says the orchestrator is "the session that runs a work item", and that the agents it starts and the daemon's role sessions read the file and take none of its steps, naming `apps/desktop/role-bundle/agents/orchestrator.md`. Read: that agent's definition says it writes no file and runs no command that asks for permission (`orchestrator.md:21-24`). `docs/architecture.md:189` says the daemon passes the repository with `--add-dir` and `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1`, so the role sessions read the file. The anchor `#role-sessions-run-detached-from-the-users-environment` matches the heading at `docs/architecture.md:173`.

```seal
confirms: round-1#6
```
What holds: `docs/name.md:30` rules a name out on "a software trademark (class 9 or 42) with a near spelling", and `docs/name.ko.md:30` reads "소프트웨어 분야(9류, 42류)". Both agree with `docs/name.md:23` and its twin. Executed: `git grep -n -F "class 42" -- docs`, which prints nothing.

```seal
confirms: round-1#7
```
What holds: `routing.md:26` names "#129, #279 and #322 among them", and #333 no longer. Executed: `git grep -n -F "#333" -- seal/threads/1795797648-323-the-rules-live-in-the-repository/routing.md`, which prints nothing. `phase-1.md:15` says #333 owns none of the 44 rules, which agrees.

What matched: the Korean twins of the two documents the fix diff changed still match. Executed: `grep -c` over `docs/roadmap.md` and `docs/roadmap.ko.md` gives headings 11/11, table rows 40/40 and bullets 25/25, and over `docs/name.md` and `docs/name.ko.md` it gives 5/5, 0/0 and 14/14. `git grep -n -e '도장' -- docs README.md README.ko.md CLAUDE.md` finds nothing. Read: each changed line beside its twin. The roadmap's two sentences on what a release and a milestone hold, and the brand criterion's classes, say in Korean what the English says.

What matched: every rule the fix diff leaves in `CLAUDE.md` has one home and is true at the target. `CLAUDE.md:15-17` and `:21-23` have no other statement in `docs/` (round 1's search, carried, and the fix diff adds no `docs/` sentence on them). `CLAUDE.md:16` is true of the workflows, as the confirmation of round 1's finding 4 shows. The `docs/` sentences the fix diff changed, `docs/roadmap.md:47` and `docs/name.md:30` with their twins, each state their rule once.

What matched: `pr.md:4` copies `routing.md:27` word for word, and `pr.md:3` copies `gaps.md:5` (executed: a string comparison of each pair). `routing.md:27` now says the change touches no code "beyond the release's version move in `apps/desktop/package.json`", which `git diff --stat 8d4d65ea..6fde83a8 -- apps .github` confirms: that file alone.

What matched: the `gaps.md` diff removes no row. Read: the row on unseen owners of a written rule is closed in place with `closed`, and its answer cites round 1's *Confirmations*. Round 1 names a search there as a sample, and the answer says so too. No `gaps.md` is removed.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite and the rest of `seal/config.json` `Broad gate`. This round ran neither, and the label stays `unverified` | the whole tree at the target | the orchestrator, at the broad gate |
| Whether the owner approved 0.2.0 in words this round did not see (finding 1) | the conversation the quote at `routing.md:29` comes from | the orchestrator, from the owner's words |
| Whether the note in #322's body that finding 2 asks for is written. It stands outside the branch, and no round reads it | issue #322 | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `git ls-remote origin 'refs/tags/v0.1.0' 'refs/heads/release/*'`; `gh pr list --state all --base release/v0.2.0` | `release/v0.2.0` at `aec3e8ac`, the tag `v0.1.0` stands; no pull request into the release branch |
| `git show 7c6cba4a -- apps/desktop/package.json .github/workflows/owlery-seal.yml` | the move to 0.1.0 changed the version and the pin together |
| `git grep -n -F "0.1.0" -- ':!*.md' ':!pnpm-lock.yaml'` | the pin in `owlery-seal.yml`, and test inputs, comments and examples |
| `ls .github/workflows` and `awk` over each `on:` block | four workflows, with the triggers as `CLAUDE.md:16` states them |
| `grep -c '^#'`, `grep -c '^\|'`, `grep -c '^ *- '` over each changed English and Korean pair | equal counts in each pair |
| a string comparison of `pr.md:3` with `gaps.md:5`, and of `pr.md:4` with `routing.md:27` | both equal |
