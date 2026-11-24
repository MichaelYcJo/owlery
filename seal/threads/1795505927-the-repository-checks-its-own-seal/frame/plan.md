# Implementation Plan: the repository checks its own seal (#146)

## Technical context

The tree as read at `87201ce`.

- `pr-check/skills/code-review/scripts/chain_check.py` holds the check's name in `CHECK_NAME` and its titles in the constants beside it. `#outcome` is the one function that gives a title, from what `#judge` found: the judged work items' newest verdict blocks and the sealed commits of the broken seals.
- `pr-check/lib/fields.py` reads a verdict block's `rules:` line through the same reader as its other lines, so `#outcome` reads whether a block holds one without a grammar of its own.
- `apps/desktop/src/daemon/records-place.ts#workflowText` is the one text of the workflow. `apps/desktop/test/records-place.test.ts` already holds a setup's file to that function, for a version the case names.
- `apps/desktop/src/daemon/github.ts#sealSection` is the one writer of the body's seal section, and `#withSealSection` replaces whatever stands between the two marker lines.
- `apps/desktop/test/pr-check.test.ts` runs the check with `python3` in temporary repositories. Its helpers write a routing that names `the session`, so the case of `frame/design.md` *Scope* item 10 needs a routing and a frame its helpers do not write yet.
- `.github/workflows/check.yml` runs `pnpm -r run check` on macOS with Python 3.12, which is where the cases of this work run on a pull request. Its checkout holds one commit, so no case reads this repository's history.

The constraint that shapes the work is where the check comes from. The workflow fetches `pr-check/` from the release's branch or tag, so the check that judges a pull request is never that pull request's own copy. This work's own pull request is judged by the check of `release/v0.0.3`, under the earlier name, and every later pull request by the check this work merges.

The failure scenario of the chosen approach: this repository's work items are still written by the AgenticSeal plugin's process, at whatever release of the plugin the owner runs, and the owned check reads their form with a reader taken from plugin 0.38.4. In six months a plugin release adds a line to a block the owned reader reads. The owned check then refuses that line on every pull request the plugin's process opens. The case of *Scope* item 10 does not catch it, because the case holds the form of plugin 0.38.7. The fix is a change to `pr-check/`, and the pull request that carries it is judged by the check it fixes. No rule of this repository requires a check (`frame/design.md` *Grounding*), so the person merges that one pull request past a failed check, or the owl chain builds it.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| `hygiene.yml` goes whole, `owlery-seal.yml` comes in, and the owned check reads both forms of record | The failure scenario of *Technical context* | Chosen. The owned check passed the pull requests of the plugin's process that `frame/design.md` *Grounding* names (executed), and the plugin's reader refuses the owl chain's lines (the same section, executed) |
| Both workflows run side by side | The first pull request the owl chain seals, #176's, carries a verdict block with `built-by:` and `judged-by:`. The plugin's check refuses each line, and the pull request shows a failed check beside a passed one | Rejected: it is the defect the issue's title names |
| `hygiene.yml` stays, cut down to its `seal mode --check` step | A workflow clones the plugin on every pull request to read a key nothing reads at runtime, pinned to a plugin release a person moves by hand. Pull request #156 was opened to move that pin once | Rejected. Owlery keeps records in one place, so the key has nothing to disagree with |
| The owned check reads the owl chain's records alone, and refuses a work item whose routing names a framer | This work item's own pull request fails, and so does every work item the plugin's process builds here while the owl chain has no framer, which is until issue #54 in release 0.0.5 | Rejected |
| A workflow of this repository's own, which runs `pr-check/` from the pull request's checkout. This replaces the structure the app writes for every repository | A pull request that weakens the check is judged by the weakened check. This repository then runs a workflow no connected repository runs, so a defect in `workflowText` reaches a user's repository unseen | Rejected. The premise that keeps the app's structure, that the check comes from the release and not from the pull request, is the rule "The PR check runs on GitHub without the app" of `docs/architecture.md` *Records are committed to the repository*, read at `87201ce` |
| This repository's workflow is written once for `0.0.3`, and no case holds it | After the tag `v0.0.3` exists the file fetches that tag for good. A fix to the check in a later release then never judges this repository's pull requests until a person remembers the line, as with `hygiene.yml` | Rejected for the case of *Scope* item 8 |
| The posted check is `seal` and the job keeps the id `seal` | Two check runs of one name stand on each head commit. The run of a fork's pull request has a job `seal` and no posted check, so a rule that requires `seal` is met by the job, and the README's sentence that a required check holds a fork's pull request stops being true. The daemon's list of a pull request's checks shows two rows of one name. How GitHub reads the pair is not probed | Rejected for *Scope* item 3. `frame/questions.md` Q1 holds the job's new name |
| The title always says that the owl chain gave the seal | A pull request the plugin's process sealed, this repository's own among them, gets a title that names a chain which did not judge it | Rejected. `docs/product.md` *The seal* item 2 holds the check to one answer with the app only for a seal Owlery gave. The `rules:` line is a fact the reader gives exactly |
| The body's heading stays `## Owlery seal` | The heading names the app as what gave the seal, against the owner's naming, and the search of scenario 9 would need a pattern that tells a heading from a check's name | Rejected for *Scope* item 4. The check reads no heading, so an earlier body still passes |
| The documents' changes go into `## Rule changes` for the settle | `docs/product.md` names the earlier name and `docs/architecture.md` states the earlier compatibility until release 0.0.3 settles. The issue's *Done when* reads both against the tree, and the owner's walk (#184) reads them before the settle | Rejected: the subject is judged in `frame/design.md` *Scope*, as #181's frame judged its own |
| #146 merges before #181 | #181's branch then takes `owlery-seal.yml` at its next merge of the release branch. Its documents and its new cases name the check as it stood, so its frame changes mid-build, and the search of scenario 9 is broken again by the lines #181 adds | Rejected. *Overlap with the release* gives the order |

## Phases

Each phase ends with its cases passing through the narrow run of the files it names. The broad gate is the orchestrator's.

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | The switch: `frame/design.md` *Scope* items 8, 9 and 10, and *Removes* row 1. The workflow's text is `workflowText`'s as this phase finds it. This phase touches no file #181 changed at `fec88dc` but `apps/desktop/test/pr-check.test.ts`, where it adds a case, so it can be built before #181 lands | Scenarios 4, 5 and 6 | |
| 2 | The names, in the code and the cases: *Scope* items 1 to 7, the lines of *Removes* rows 2 and 3 outside the documents, and this repository's workflow written again from the changed `workflowText`. The phase is built on a branch that holds #181: the party that builds it merges `release/v0.0.3` first, as *Overlap with the release* states | Scenarios 1, 2, 3, 7 and 8, and scenario 4 again. At the phase's commit `git grep -n -w -e 'Owlery seal' -- . ':!seal/threads' ':!docs' ':!README.md' ':!README.ko.md' ':!pr-check/README.md'` prints nothing: at `87201ce` it prints lines of the files *Removes* row 2 names under `apps/desktop/` and of `chain_check.py` alone, and phase 3 rewrites the documents left out | |
| 3 | The documents: *Scope* items 11 to 15, the documents' lines of *Removes* rows 2 and 3, and rows 4 and 5 | Scenario 10, and scenario 9's search whole | |

Scenario 11 is read at the pull request, after the phases.

## Overlap with the release

The spawn names one item, #181. #182 and #183 are merged at `18f9158`, and this branch holds them. #176 is not started and is named below because the issue's *Done when* orders this work before it. This branch is never rebased: it merges `release/v0.0.3`, so the commits its records cite stay.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #181, a pane carries the owl chain (frame at `seal/threads/1795497826-pane-carries-the-chain/frame/` on its branch, read at `fec88dc`, in its phase 3) | The rule: this work installs `owlery-seal.yml` here, which #181's *Scope* item 1 reads as "on the owl chain". The files, at `fec88dc`: `pr-check/skills/code-review/scripts/chain_check.py` (#181 changed the refusal in `#guarantee`, this work the name, the titles and the opening paragraph); `apps/desktop/src/renderer/view.ts` (#181 the view's foot, this work `#requiredCheck`); `apps/desktop/test/chain.test.ts`, `daemon.test.ts`, `pr-check.test.ts`, `pull-request.test.ts`, `screenshots.test.ts`, `view.test.ts` and `fixtures/sample-gh/gh`; `apps/desktop/test/get-a-seal.test.ts`, which #181 removed; `apps/desktop/test/chain-command.test.ts`, which #181 added with one line that pins the section's heading. The documents, in #181's phase 6, not built at `fec88dc`: `docs/product.md` *The seal* item 2 and `docs/roadmap.md` *Why this order* ground 4, with the Korean edition of each. The check: the search of scenario 9 reads the whole tree, #181's lines among it | #181 | #181's plan already states this order, and the owner's decision has the switch land "once #181 and this issue land". A check that reads the whole tree merges after the content it reads. #181 is in flight with its documents unwritten, and this work is the smaller diff, so the integration falls inside rounds this work spends anyway |
| #176, a broken seal's sentence (not started) | `apps/desktop/src/renderer/view.ts`, in two places that do not meet. The rule: #176's pull request is the first the owl chain seals, and the plugin's check would refuse it | #146 | The issue's *Done when*: the switch lands before the first pull request the owl chain seals |

**This side ports everything, and #181 ports nothing.** Once #181's pull request is merged, the party that builds phase 2 merges `release/v0.0.3` into this branch before it edits a line. It then renames every line the merged tree holds: the lines #181 kept, the line of `chain-command.test.ts`, the check's name in `fixtures/sample-gh/gh` as #181 left that file, and the list of checks in `screenshots.test.ts` as #181 left it. `get-a-seal.test.ts` is gone and takes its line with it. Phase 3 changes the check's name inside the sentences #181 wrote in `docs/product.md` and `docs/roadmap.md`, and leaves the rest of them. Where phase 1 was built before the merge, the merge meets one file both changed, `pr-check.test.ts`, where this work added a case and #181 changed others.

Once both are merged, a Claude Code pane of this repository carries the owl chain by #181's *Scope* item 1, and #181's choice asks the owner once which chain runs here.

## Operational impact

- **This repository's pull requests.** From this pull request on, GitHub runs the workflow `seal` with the job `records`, and no `hygiene`. On this pull request the check comes from `release/v0.0.3` as it stood before the merge, so it posts under the earlier name once. Every later pull request gets the check `seal`.
- **The pull request that moves the version rewrites `.github/workflows/owlery-seal.yml`.** The case of *Scope* item 8 fails until it does. The file then fetches the new release's branch until its tag exists.
- **A repository connected under 0.0.2 keeps the workflow that release wrote.** That file fetches the check at `v0.0.2`, which posts under the earlier name, and its job bears the id `seal`. The app rewrites no committed file. The work item's changelog fragment tells the owner of such a repository to replace the file with the one this release writes, and to require `seal` where a rule required the earlier name.
- **An administrator who required the check requires it again under `seal`.** No rule of this repository requires a status check (`frame/design.md` *Grounding*, executed), so nothing changes here.
- **The plugin's process in this repository.** `seal pr-checks` reports no workflow of the plugin's. Its sealer's first step and its orchestrator hold its invariants before the pull request, as its `skills/core/SKILL.md` states.
- **No migration, no new environment variable, no new dependency.** A daemon and a window of an earlier build read nothing this work changes.
- **This pull request does not move the version.** It is `0.0.3` since #183.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
