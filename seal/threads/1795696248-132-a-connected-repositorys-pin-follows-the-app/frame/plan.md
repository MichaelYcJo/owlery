# Implementation Plan: a connected repository's seal check follows the app (#132)

## Technical context

The tree as read at `c467d965`.

The work builds on four places, each read (`frame/design.md` *Grounding* holds the coordinates):

- `apps/desktop/src/daemon/records-place.ts`: `workflowText`, `readRecordsPlace`, `planRecords` and `setUpRecords`. The move reuses the plan, its stamp, its blocking arms and its commit runner. The new code is a second kind of written file: one that replaces a committed file, where the setup's files are created only where nothing stands. The blocking arms that guard the setup's new files (`occupied`, `notFolders`, `otherLetters`) are computed from the files the setup creates, and the moved workflow stays among the kept files there, so the checkout's copy of it is still compared with the commit's.
- `apps/desktop/src/daemon/daemon.ts`: `readRecords`, which the pass of `readCommits` runs for every repository, and the handlers of `planRecords` and `setUpRecords`. The `planRecords` handler adds `unread` after `planRecords` returns, so `records-place.ts` stays free of work items.
- `apps/desktop/src/daemon/seal-state.ts` and `chain.ts#standingOf`: the reading of a work item's records at its head, as the seal is read.
- `apps/desktop/src/renderer/sidebar.ts`, `view.ts#recordsDialog` and `renderer.ts`'s records dialog: the row's button and the dialog's words. The dialog's request flow, its timer and its stamp do not change.

Constraints:

- **Only the daemon's version decides.** The window never compares versions: a window attached to a daemon of an earlier build gets no `olderCheck` and shows nothing, which is right, since that daemon would write the old pin.
- **The pin is read in the one spelling `workflowText` writes.** `docs/architecture.md`'s rule on the check's script and `skills/core/SKILL.md` *The rule a mechanism is kept against* allow a script to read a line of its own form in its one spelling. A workflow a person rewrote is named by no mark, and nothing guesses its version.
- **The move rewrites the whole file.** The template changes between versions, as the clone's fallback did, so a move that rewrote only the version lines could leave an older template running the newer check. The person reads the whole new text first.

Failure scenario of the chosen approach, six months on: a release changes the check so that it refuses a record the daemon's readers still read, through an arm the daemon has no twin of, such as the trailer arm or the rule-changes arm. The dialog then names no work item, the person moves the pin, and an open pull request's check fails at its next run. The design says in the dialog which readers were read, so the person is not told that nothing would be refused. The out-of-scope issue that runs the check itself closes the gap.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Keep the setup's structure as it is, which writes the workflow only where none stands, and tell the person in the dialog to delete the workflow and connect again | The person deletes the file in a commit of their own, and the setup's next commit writes the new one: two commits, a window in which the repository has no check, and a pull request opened between them passes unjudged. | Rejected. The premise that keeps the structure, that a committed file is never written over, protects the person's own files. The workflow is Owlery's file, the plan shows it whole before the write, and the checkout is compared with the commit before it. |
| Replace the setup's plan with a separate plan and commit for the move, with its own messages | Two plans that each compare the checkout with the commit and each block on their own arms drift apart; the next change to one arm reaches one of them. | Rejected for this work. The move is one more kind of file in the same plan, and the same stamp, arms and runner carry it. |
| Rewrite only the version on the clone lines and the step's name | A release that changes the template, as the fallback to the release branch once did, leaves the repository running the new check with the old steps. | Rejected. The move writes `workflowText(version)` whole, as the first commit did. |
| Ship `pr-check/` with the app and run the new check on each open work item before the move | Python 3.12 is not on a stock Mac, and the check reads a pull request's event and branch from GitHub's environment. A run that cannot start says nothing about the records. | Rejected for two days; named out of scope with an issue to file (`frame/design.md` *Scope*). |
| Name every open work item of the repository before the move, refused or not | Every work item is named on every move, and the list says nothing the person can act on. | Rejected. The issue asks for the repositories whose records the new check would refuse, and the daemon's readers are held to the check's answers by cases. |
| Move the pin by itself when the app updates, with no dialog | A commit lands in the person's repository that they did not read. | Rejected by `docs/architecture.md` *Records are committed to the repository*: the first commit is read first, and the issue asks the same of this one. |
| Hold the move while a work item is named | A work item whose records no reader reads, through an old reader's mistake, holds the repository at the old pin until the work item is deleted. | Rejected. The issue asks that such a repository be named before the pin moves, and the person decides with the names in front of them. |
| Show the older check in the status line, or as a notice of the inbox | One sentence names many repositories, and nothing ties it to the repository's own row. | Rejected. The issue asks for it on the repository's row. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 6, and the cases of item 11 for them | The cases of scenarios A to G in `records-place.test.ts` and `daemon.test.ts`, run by name by the crafter, each shown red as contract rule 15 asks | cdcb882c |
| 2 | `frame/design.md` *Scope* items 7 to 10, and the cases of item 11 for them | The cases of scenarios H and I in `view.test.ts`, run by name by the crafter. Scenario J's case in `records-dialog.test.ts` and the screenshot run of scenario K, run by the crafter in one batch of built-app runs at the phase's end | bd52ff9b |

## Overlap with the release

The spawn names #215, #216 and #133 (one pull request, worktree `/Users/yc/Documents/GitHub/owlery-wt-216`, branch `feat/216-nothing-in-the-window-reads-the-daemons-lists-again`), #223 and #213. Their branches were read with `git diff --stat <merge base> HEAD` and their frames where they stand (`executed`). #223's and #213's frames stand uncommitted in their worktrees, and only their file lists were read. #217's pull request #274 is open on the release with six rounds and a guarantee, and the spawn does not name it. It is read here because it changes `WorkItem.branch`, which *Scope* item 6 reads.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #215, #216 and #133 | `sidebar.ts#showSidebar` (#215 adds the empty sentence after the repositories; this work adds a button to each repository's row), `view.ts`, `renderer.ts`, `protocol.ts`, `daemon.ts`, `docs/design.md` and its Korean edition (#216 adds a row to *Components and their states*), and `screenshots.test.ts`. #216's `readLists` reads `readCommits` again, which reads every repository's records place, so its refresh also reads `olderCheck` again. #133 decides when the daemon of the updated app runs, and so when the row first shows an older check | #215, #216 and #133 | Their branch has closed its phases and holds two rounds. Their edits to the sidebar and to the components table are in other hunks, and the integration is a rebase inside this work's own rounds. |
| #217 | `daemon.ts`, `view.ts`, `renderer.ts`, `protocol.ts` (`WorkItem.branch` becomes `string \| null`), `seal-state.ts#workItemSeal` and `screenshots.test.ts` | #217 | Its pull request is open with a guarantee. *Scope* item 6 reads a work item's branch, and builds on the null that #217 gives a work item with no branch. |
| #223 | `view.ts` (the approval line), `daemon.ts` and `protocol.ts`, from its frame's list of files | Whichever of the two seals first; this work expects to | The two change different functions of the same files. This work is smaller and its milestone, `release: 0.1.0`, is due 2026-11-28. |
| #213 | `view.ts`, `index.html`, `themes.css`, `protocol.ts`, `daemon.ts`, `docs/design.md` and its Korean edition (a row for the tab's menu) and `screenshots.ts`, from its frame's list of files | Whichever of the two seals first; this work expects to | Different functions and different rows of the same files. Both add a row to the components table, and the later rebase keeps both. |

## Operational impact

- No migration, no new environment variable and no new dependency.
- **The protocol gains optional fields**: `RecordsPlace.olderCheck`, `RecordsPlan.move` and `RecordsPlan.unread`. A window reads each one's absence, from a daemon of an earlier build, as nothing to show.
- **A repository connected by a build of 0.0.5 fails its check once `release/v0.0.5` is deleted**, since no tag `v0.0.5` will exist (`frame/design.md` *Grounding*). Owlery's own repository is not among them: the pull request that moves the version to 0.1.0 (#58) rewrites its workflow. Any other repository the owner connected with a 0.0.5 build shows "Check 0.0.5" in the app of 0.1.0 and moves from there.
- This pull request moves no version.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
