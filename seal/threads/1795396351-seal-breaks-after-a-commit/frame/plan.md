# Implementation Plan: 1795396351-seal-breaks-after-a-commit

## Technical context

The tree as read at `40a50bf`. #41's code is read at `158f62c`, the head of `origin/feat/41-the-daemon-cannot-run-review-rounds`. #42's frame is read at `0cff3e9` and #43's at `3c13a7a`, and none of their code is built. #46's frame and code are read at `9be0035`. The build of this work starts once #43 has merged into `release/v0.0.2` and this branch has merged the release branch, so each coordinate of the gate's, the seal's and the pull request's code below is named by #42's and #43's frames and has no line yet.

**What the work builds on.**

- `apps/desktop/src/daemon/daemon.ts#readBranch` (the call of `newCommits` and `branchHead` at line 1785) reads each open work item's head from `refs/heads/<branch>` in the repository, and reads the commits and the changed files again only where the head is another commit. `#scheduleCommitRead` repeats the pass while a client is connected. The seal's state is read in the same place, on the same condition.
- `chain.ts#standingOf` and `chain.ts#stepOwed` (`158f62c`) are the order's reading and the order's function. #42 adds the gate's and the seal's rows and the answer `sealed` (`seal/threads/1795393338-broad-gate-and-sealer/frame/design.md` *Scope* item 1). This work calls the function with a reading of the head commit and adds no row.
- `worktrees.ts#fileAt`, `#filesAt`, `#holdsCommit` and `#diffBetween` (`158f62c`) read a file, a folder, an ancestry and the paths that differ between two commits. The head reading and the seal's sentence need no other git command.
- `chain-records.ts#lastVerdict` (`9be0035`) reads the last verdict block of a text, and #42's frame leaves it as the one reader of the newest verdict.
- `apps/desktop/src/renderer/shared.ts:124` `sealPlace` is called for a line of the inbox (`list.ts:149`), the preview (`list.ts:82`), a line of the summary (`summary.ts:50`) and the view's foot (`work-item-view.ts:1059`), and by the sealer's place that #46 adds. `index.html` lines 143 and 144 hold the sealed form.
- `apps/desktop/src/renderer/view.ts#parkNotifications` and `renderer.ts#takeLists` are the form a notification from two lists takes.
- `pr-check/skills/code-review/scripts/chain_check.py:1722` `guarantee` and `:1021` `follows`, with the function of the outcome that #43 adds.

**Constraints.**

- The daemon runs no Python (`docs/architecture.md` *What we take from AgenticSeal*), so the daemon and the check hold the rule in two languages. *Scope* item 11 of `frame/design.md` holds them to one answer for the histories it lists.
- The page's style writes no filter of its own, and every token stands in every block of `themes.css` and in both editions of `docs/design.md` (`apps/desktop/test/themes.test.ts`).
- No message carries a session's id, and no field names a vendor.
- No case reaches GitHub or starts a real `claude`.

**The failure scenario of the chosen approach.** In six months a team keeps its branches up to date with the base by merging it, and each such merge after a seal breaks the seal: the line waits, a notification arrives, and a round, a gate and a sealer run again before the pull request can merge. The promise asks for exactly that, and it is the cost a person meets first. The second failure: the order's function and the check drift, and a line shows a lit seal on a head whose check fails. Scenario 9 holds the two together for the histories it lists and for no other. A merge of the base whose commits leave the tree as it was reads `broken` in the daemon and passes the check, since the rounds arm skips the base's own commits. The third: the head reading costs one git call for each round record at every move of a head, so a daemon with many open work items and long chains reads slowly after a fetch that moves many branches. `frame/questions.md` Q4 names what measures it. The fourth: a person who goes on working after a seal gets one notification at the first commit, and mutes the work item. The fifth: a sealer that judges the changed part stands on the earlier run's audit, so a defect the earlier run missed is not met again by the new seal.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| The state is the order's function over a reading of the head commit alone (chosen) | The second and the third failure scenarios above | Chosen. One function then says both what `getSeal` would run and whether the seal holds, so the line never shows a lit seal where the button would start a round. The check's rounds arm, gate arm and guarantee arm are the same rows read on GitHub |
| The head commit is compared with the sealed commit, as the issue's first line words it | The daemon commits the gate's record and the guarantee after the gate's commit, so the head never is the sealed commit and every seal reads `broken` | Rejected. `seal/threads/1795393338-broad-gate-and-sealer/frame/design.md` *Scope* items 1 and 7 put the closing records after the sealed commit |
| The state is read from the gate's row and the seal's row alone: two trees, and no rounds | Two commits of which the second takes the first back leave the sealed tree, so the line shows a lit seal while the check's rounds arm fails the pull request (`frame/design.md` *Grounding*, the probe) | Rejected. The inbox and the pull request would give two verdicts on one head |
| The state is read from `Recorded.verdict`, which #46 already sends, compared with the head in the window | That field reads the worktree, committed or not, so a `guarantee.md` that is written and not committed shows a seal, and the window would hold the rule of what may follow a seal | Rejected. The issue's fourth line asks for git and the committed record |
| `Chain.state` loses `sealed`, and `WorkItem.seal` alone says whether a seal holds (chosen, replaces the structure "the chain's stored state says sealed") | A rename across the code and the cases #42 and #43 build, in the release that first writes them | Chosen. A stored `sealed` stays after the branch moves, between two reads and while no client is connected, which is the defect the issue names. No release has shipped the state |
| `Chain.state` keeps `sealed`, and the daemon rewrites the stored chain to `stopped` when it reads a broken seal (keeps the structure) | The stored state is true only after a read. A `ready` that goes out before git has answered carries a chain that says `sealed` for a broken head, and a second machine's clone has no stored chain at all | Rejected. The premise that would keep the structure is that the daemon's stored state follows the branch: checked in `daemon.ts#scheduleCommitRead`, where no read runs while no client is connected, and it does not hold |
| The state is read in the pass that reads the branches, where a head moved (chosen) | A commit is seen one interval late, 3 seconds when `commitPollMs` is absent, and not at all while no client is connected | Chosen. The window's page stays connected while the window is hidden (`docs/architecture.md` *Screen framework: Electron*), and the hello of the next client reads at once. The pass already knows which heads moved |
| A watch of the files under `.git/refs`, or a hook of the repository that tells the daemon | Packed refs and a worktree's own git directory move a branch without the watched file, and a hook is a file written into the person's repository that another tool may replace | Rejected. A second way to learn of a commit beside the pass, with cases of its own |
| The guarantee arm of the check compares two trees (chosen, replaces the walk of commits in that arm) | The first failure scenario above: a merge of the base now fails a check that passed it | Chosen. The probe shows a merge commit that changes a source file passing the check after a seal, which no reading of the promise allows. #42's frame already reads the gate from two trees |
| The check keeps its walk, and the daemon reads a merge of the base as no break (keeps the structure) | A change made in a merge commit after the seal is sealed on screen and on GitHub, read by no round, no gate and no sealer | Rejected. The premise that would keep the walk is that a merge of the base brings nothing the seal vouches for: checked by the probe's merge with a hand edit, and it does not hold |
| The walks of the rounds arm and the gate arm are replaced as well | #41's verifying round is owed by a walk of commits, so the check's rounds arm would stop agreeing with the daemon's row | Rejected. The guarantee arm alone closes the hole, and the other two arms stay as #41's and #42's rows read them |
| The check's outcome and its title say that the seal is broken (chosen) | A person who reads only the pull request's body sees the last verdict block and no word of the break | Chosen, with the sentence of `frame/design.md` *Scope* item 10 in the seal section. The check runs on GitHub at every push with or without the app, and `docs/product.md` *The seal*, item 2, names the check as the seal's display on the pull request |
| The daemon rewrites the seal section of the body when it reads a broken seal | It works only while the app runs and the person is logged in to `gh`, it is a second caller of GitHub beside the pull request stage, and the body arm would need a grammar for a broken section | Rejected |
| A broken seal is drawn as the seal parted in two with its red taken out, under one new token (chosen) | Six blocks of `themes.css` and both editions of `docs/design.md` gain a row | Chosen as the default. `docs/design.md` *Principles* 1 lets a red say only that this commit was judged, so a broken seal holds none, and a drawing that keeps the seal's outline says that a seal was given. `frame/questions.md` Q1 leaves the choice to a person |
| A broken seal is drawn in the blank tones of a place with no seal, parted in two | No new token, and at 18px a broken place is hard to tell from a blank one | Rejected as the default. An option of Q1 |
| `docs/design.md` and `docs/design.ko.md` changed in this pull request (chosen) | Another work item of the release changes the same rows, and a merge resolves both | Chosen. *Principles* 8 has a form written there first, `test/themes.test.ts` fails a token the document does not name, and #46 changed the same rows the same way. The rules of `docs/product.md` and `docs/architecture.md` stay in *Rule changes* for the settle |
| A broken seal makes the line wait (chosen) | A person who commits after a seal on purpose sees a waiting line until the next seal | Chosen. The work item needs the person's "Get a new seal", and *Principles* 3 spends the one signal on what needs the person |
| A broken seal makes the line `failed` | A failure is a stage's, and nothing of the work item failed | Rejected |
| A notification where a seal goes from `sealed` to `broken` (chosen) | A seal that broke while the window was closed raises none | Chosen. The window compares two lists it held, as it does for a park. What happened while the person was away is the summary's, #22 |
| A notification for every work item that is `broken` at a list | Each start of the window notifies again for each broken work item | Rejected |
| The sealer of a new seal is handed the part that changed since the broken seal (chosen) | The fifth failure scenario above | Chosen. `docs/product.md` *File explorer and editor* states it: one review round and the sealer read only the part the person changed. The verdict still names the whole branch against its base |
| The sealer of a new seal reads the whole branch again, as #42's prompt has it | Each commit after a seal costs a whole audit, against the policy's sentence | Rejected |
| `WorkItem.seal` is optional and a look keeps none (chosen) | #22 adds the field to the look when it frames | Chosen. #46 did the same with `recorded`, and no comparison of this work reads a look's seal |
| The daemon remembers that a branch was sealed after a reset took the guarantee out of the head | A state that only one machine's daemon holds, which a restart loses unless it is stored, against the issue's fifth line | Rejected. The state is null, as the check says for that head |

## Phases

Each phase is one crafter's. The cases of a phase are seen red before they are planted, and each phase names its narrow run in its record. Each coordinate of #42's and #43's code is read as merged, and a phase that finds it departs from their frames records the departure in its phase record.

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1. The seal's state | `frame/design.md` *Scope* items 1 to 6 | Scenarios 1 to 8 | |
| 2. The check | *Scope* items 7 to 11 | Scenarios 9 to 12 | |
| 3. A new seal | *Scope* items 13 and 14 | Scenarios 17 and 18 | |
| 4. The window | *Scope* items 12 and 15 to 23 | Scenarios 13 to 16, 19 and 20 | |

The new test file that `frame/design.md` *Rule changes* names in its `check:` lines, `test/seal-state.test.ts`, is made in phase 1 under that name. The check at the pull request refuses a `check:` line that names no file.

## Overlap with the release

The spawn names #42, #43, #41, #46 and #27, whose frames stand committed on their branches, and #22, which is framed after this work. Each frame was read at its branch's head: `0cff3e9`, `3c13a7a`, `158f62c`, `9be0035` and `182fa8c`. #45 is in the release's order and was read for the files it changes. The release's work items merge in the order #27, #45, #41, #46, #42, #43, this work. The build of this work starts once #43 has merged into `release/v0.0.2` and this branch has merged the release branch.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #42, `1795393338-broad-gate-and-sealer` | `src/daemon/chain.ts`: the order's function, which this work calls and does not change, `standingOf`, which gains where it reads three records, and the sealer's prompt, which this work narrows after a broken seal. `src/shared/protocol.ts#Chain`, where this work replaces the state `sealed` that #42 adds. `pr-check/skills/code-review/scripts/chain_check.py#guarantee`, where #42 rewrites the arm's sentences and adds a refusal, and this work replaces the arm's walk. `CLOSING_RECORDS`, which this work reads. `apps/desktop/role-bundle/agents/sealer.md` and the bundle's `docs/forms/the-guarantee.md`. `test/chain.test.ts`, `test/pr-check.test.ts` and `test/role-bundle.test.ts`. Its changelog fragment | #42 | This work reads the rule #42 defines, and its issue depends on #42 through #43. What this work needs of #42 as merged: the answer `sealed` of the order's function; the rule of two trees and the closing records; the newest verdict read through `lastVerdict`; the sealer's prompt as one function |
| #43, `1795395059-pull-request-and-seal-check` | `chain_check.py`, the function of the check's outcome, to which this work adds a row. `src/daemon/github.ts`, the seal section's fixed sentence. `README.md` and `README.ko.md`, the section on the seal check. `src/renderer/view.ts#inboxLine`, where both give a line its state, and the view's foot, where both stand under the seal's place. `test/pr-check.test.ts`, `test/pull-request.test.ts`, `test/view.test.ts` and `test/screenshots.test.ts`. Its changelog fragment | #43 | Its issue is the one this work's issue depends on. What this work needs of #43 as merged: one function for the outcome, the seal section composed in one place, and `WorkItem.pullRequest` in the line's order |
| #41, `1795388700-review-rounds` | `src/daemon/chain.ts#standingOf`. `src/daemon/daemon.ts`, the chain's run, which asks for the read of the seal. `src/renderer/`, the "Get a seal" button, whose words this work changes at a broken seal, and `view.ts#inboxLine`, where a stopped chain and a broken seal stand next to each other in the order. `test/chain.test.ts`, `test/get-a-seal.test.ts` and `test/daemon-restart.test.ts` | #41 | It merges third of the release, and this work extends what it defines |
| #46, `1795342001-progress-through-roles` | `src/renderer/shared.ts#sealPlace`, which the sealer's place calls and which gains a parameter. `src/renderer/view.ts`, the table of a place's state, whose sealer rows this work changes. `src/renderer/themes.css` and `index.html`. `docs/design.md` and `docs/design.ko.md`, the row "The seal's place", the sentence under the components' table, the token tables and the section on the screenshots, which both pull requests edit in place. `test/approval-line.test.ts`, `test/view.test.ts`, `test/themes.test.ts` and `test/screenshots.test.ts` | #46 | It merges before #42. This work edits the sentences of `docs/design.md` as #46 leaves them, so no merge has to choose between two edits |
| #27, `1795388701-agent-choices-and-behind` | `src/daemon/daemon.ts#readBranch`, where #27 counts the commits behind the base and this work reads the seal. `src/shared/protocol.ts#WorkItem`, `src/renderer/view.ts#lineText` and `test/screenshots.test.ts`, in other declarations | #27 | It merges first of the release, and neither reads a rule or a fact of the other |
| #45, `1795341001-cost-per-stage` | `src/daemon/daemon.ts` and `src/shared/protocol.ts`, in other declarations | #45 | It merges before #41, and neither reads a rule or a fact of the other |

#22 is not framed. It reads `WorkItem.seal`, and this work leaves the look and the summary's sentences to it.

## Operational impact

- No migration. A chain stored with the state `sealed` is read as no chain. No release has shipped a build that stores one.
- No new environment variable and no new dependency.
- The check of a connected repository turns stricter: a merge commit after a seal fails it. A repository's workflow fetches `pr-check/` at the tag of the release that wrote the workflow, and no release has shipped the workflow, so no connected repository holds the earlier rule.
- This repository's own pull requests are checked by AgenticSeal's check through `.github/workflows/hygiene.yml`, so a change to `pr-check/` changes nothing of the check on this work's own pull request.
- This pull request moves no version.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
