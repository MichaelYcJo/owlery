# Design: a connected repository's seal check follows the app (#132)

## Grounding

The tree as read at `c467d965`, the work item's routing commit on `c35c8271`, which `refs/remotes/origin/release/v0.0.5` still names after a fetch on 2026-11-26 (`executed`, `git rev-parse`).

`routing.md` stands in this directory and answers `Planning | framer` and `Automation | yes` (`read`). Issue #132 was read with `gh issue view 132 --json title,body,comments,labels,milestone` (`executed`): it holds no comment, and the spawn handed no line on comments. Its milestone is `release: 0.1.0`, whose description names "a connected repository's seal check moved with the app (#132)". `seal/follow-up.md`, `seal/parity.json` and `docs/README.md` do not exist (`executed`, `ls`). The latest release, `v0.0.4`, holds no `### Process changes` heading (`executed`, `gh release view --json body`), and no `changelog.md` under `seal/threads/` holds one (`executed`, `grep -ln`). The frame of #40, which wrote the pin, stands at `cc0b9387:seal/threads/1795338001-records-place-and-pr-check/frame/design.md`. Its out-of-scope item 26 named this move and gave it no issue (`read`).

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Records are committed to the repository*, the bullet "When a repository is first connected, the place for records and the PR check are created together, in one commit the person reads first" | The move is made the way the first commit is: the app shows the file it writes, the commit's subject and its branch, writes nothing until the person confirms, commits that file alone with the repository's hooks, and pushes nothing. It refuses while the checkout does not hold the file as the commit does. |
| `docs/architecture.md` *Records are committed to the repository*, "fetches `pr-check/` from Owlery's repository at the tag of the release that wrote the workflow … Until that tag exists it fetches the release's branch" | The pin is the version of the release that wrote the file. Once the move rewrites it, that is the release that wrote it last. *Rule changes* rewrites the sentence. |
| `docs/architecture.md` *Records are committed to the repository*, the paragraph "Whether a seal holds is read from the branch's head commit alone, and the pull request check reads the same records" | The daemon and the check are two programs that read the same records. The daemon's readers of the round records and of the `seal` blocks are ports of the check's, and cases hand one set of records to both (`apps/desktop/src/daemon/round-record.ts` lines 1 to 8, `apps/desktop/src/daemon/record-blocks.ts` lines 1 to 7, `read`). That is what lets the app name, before the move, the records the new version's readers refuse. |
| `docs/architecture.md` *Compatibility with AgenticSeal*, "This repository's workflow is the one Owlery writes for the app's version, and the pull request that moves the version rewrites it" | Owlery's own repository keeps its pin by that rule and by the case of `records-place.test.ts` "holds Owlery's own workflow to the one a setup writes for the app's version" (`read`, lines 900 to 903). This work leaves both as they are. |
| `docs/design.md` *Principles*, item 8 | A form the document does not state is added to *Components and their states* first, and the pull request that draws it writes its row in both editions and leaves none to the settle. So the row for the check's mark on a repository's row is written in place by the build (*Scope* item 9), and is not a `## Rule changes` operation. |
| `docs/design.md` *Principles*, items 1 and 3 | The mark is not the wax's red and not the signal: an older check does not need the person now, and the person opens the move when they choose. |
| `docs/design.md` *A pull request that changes the window carries its screenshots* | The pull request carries screenshots of the changed views from `pnpm run screenshots`. The pull request that adds a view to the run adds it to the list of views in both editions, in place (*Scope* item 10). |
| `docs/roadmap.md` *Releases and the tracker*, "The branch `release/v<version>` is cut from `main` … that merge is tagged `v<version>`" | A pin names a tag, or a release branch before the tag exists. Origin holds the tags `v0.0.1` to `v0.0.4` and `v0.0.5-package.1`, and the one release branch `release/v0.0.5` (`executed`, `git ls-remote --heads origin 'release/*'` and `git ls-remote --tags origin`). So the branches of releases that merged are gone. The version moves from 0.0.5 to 0.1.0 at this release's close (#58), so a workflow that pins `0.0.5` will find neither a tag nor a branch once `release/v0.0.5` is deleted. |

What the tree holds of the pin, `read` unless labelled:

- **One function writes the workflow, and only where none stands.** `apps/desktop/src/daemon/records-place.ts#workflowText` (line 66) composes the file for a version. Its clone step reads `--branch v${version}` and falls back to `--branch release/v${version}` (lines 99 to 105). `planRecords` gives the workflow a text only where the commit holds neither Owlery's workflow nor AgenticSeal's `hygiene.yml` (line 394), and blocks a plan that would write a path the commit holds (`occupied`, line 433). `setUpRecords` writes each file with the flag `wx` (line 519), so it replaces nothing. `git grep -n 'workflowText(' -- apps/desktop/src` prints lines 66 and 394 of that file alone, and `git grep -l 'owlery-seal' -- apps/desktop/src` prints that file alone (`executed`). Nothing in the tree moves a pin, and only this plan and setup could be extended to.
- **The version is the build's.** `apps/desktop/build.mjs` line 9 reads `package.json`'s version and defines it as `OWLERY_VERSION` for the daemon and the chain command. `apps/desktop/src/daemon/main.ts` line 72 hands it to the daemon, and `Daemon#version` (`daemon.ts` line 2844) throws where none was given.
- **The daemon reads every repository's records place again on each pass.** `Daemon#readRecords` (`daemon.ts` line 2830) calls `readRecordsPlace` on the main checkout's working tree and answers whether anything changed. `Daemon#readCommits` (line 4477) calls it for every repository, and so do the repository's addition, a creation and a setup. A daemon that starts after the app updates therefore reads each repository on its first pass.
- **A reader of the records at a head commit already stands.** `apps/desktop/src/daemon/chain.ts#standingOf` (line 506) reads each round record, `trail/gate.md` and `guarantee.md` as a commit holds them. It throws a `ChainStop` with the reader's sentence where the reader refuses a line, where a round record holds no round block, and where a round's target names a commit the repository does not hold. On a directory with no round record, gate or guarantee it throws nothing: `readGate("")` and `readGuarantee("")` find no block and refuse nothing (`apps/desktop/src/daemon/seal-records.ts` lines 93 to 129). `seal-state.ts#sealAt` calls it with the decisions read at the head, and `workItemSeal` finds the directory through `decision-record.ts#workItemDirectory`.
- **The check itself does not ship with the app.** `apps/desktop/build.mjs` copies the page and the role bundle into `dist/`, and nothing of `pr-check/`. The check runs "on Python 3.12 or newer" (`docs/architecture.md`, the paragraph cited above). A person's Mac is not known to hold Python 3.12, so the app cannot run the new check locally without shipping the check and finding an interpreter (`plan.md` *Alternatives considered*).
- **The window's row of a repository holds its fold button, its icon, its name, its count, "+" and "…"** (`apps/desktop/src/renderer/sidebar.ts` lines 152 to 177). The dialog of the records place is drawn from `view.ts#recordsDialog` (line 2610), and opened by the repository menu's "Records and check…" and by a registration of a repository that lacks a part (`renderer.ts` lines 1427 and 1454).

## Scope

In:

1. **The daemon reads the version the workflow pins.** `records-place.ts` gains `pinnedVersion(text)`: the version the clone step of Owlery's workflow names, as `workflowText` spells it, `--branch v<version> \` and `--branch release/v<version> \`. It answers null where either line is missing or the two name different versions.
2. **The daemon tells an older version by its numbers.** A version is three numbers joined by dots, with an optional suffix that starts at `-`. One version is older than another where its first differing number is smaller, or where the numbers are equal and only it carries a suffix. A version that does not parse is older than none, and none is older than it. Two versions with equal numbers that both carry a suffix are neither older.
3. **The repository tells the window that its check is older.** `RecordsPlace` gains `olderCheck`: the version `pinnedVersion` reads in Owlery's workflow in the main checkout's working tree, where it is older than the daemon's version, and null otherwise. It is null for AgenticSeal's `hygiene.yml`, for a workflow `pinnedVersion` reads no version in, and for a daemon given no version. `Daemon#readRecords` counts a change of it as a change, so the next `inbox` carries it.
4. **The plan offers the move.** `planRecords` offers a move where the plan writes no file of the setup, the commit holds Owlery's workflow as a file, and the version `pinnedVersion` reads in the commit's text is older than `version`. The plan's workflow entry then carries `workflowText(version)` as its text, the plan carries `move` with both versions, and its subject is the move's (`frame/questions.md` Q1). Every arm that blocks a plan today still blocks it, and the workflow is compared there as a kept file: a checkout whose workflow differs from the commit's, staged or not, is refused with today's sentence. The stamp covers the move, so a plan read before the commit moved or the version changed no longer sets anything up.
5. **The setup makes the move.** `setUpRecords`, given the stamp of a plan with a move, makes the plan again and refuses as today. It writes the new text over the workflow, then adds and commits that one path under `commitRunner`'s limit, with the person's identity and the repository's hooks, on the branch the checkout stands on, and pushes nothing. Where the write or the commit fails, it unstages the path, writes back the bytes the checkout held before the write, which the plan has just checked equal the commit's, and throws git's words, a hook's output among them.
6. **The daemon names the work items whose records it would refuse.** For a plan with a move, the daemon's answer to `planRecords` carries `unread`. It holds each work item of the repository that is not archived, has a branch, and whose worktree holds its directory, where `standingOf` at the head the daemon last read of its branch throws a `ChainStop`. Each entry carries the work item's id, its title and the reader's sentence. The list is no part of the stamp. A work item whose head the daemon has not read yet is not read.
7. **The repository's row shows an older check.** Where `olderCheck` holds a version, the repository's row in the sidebar holds a button before its "+": the word "Check" and the version. It says to a pointer and to a screen reader that the repository's pull request check is that version of Owlery's, older than this app, and that a press opens the commit that moves it. A press opens the dialog of the records place for the repository.
8. **The dialog shows the move before it is made.** `recordsDialog`, given a plan with a move, says which version the workflow fetches the check at and which version the commit moves it to, and shows the commit's branch and subject as today. It shows the workflow whole, as the move writes it, with the sentence that it replaces the committed file. Under it, where `unread` holds an entry, it names each work item with the reader's sentence, and says which records were read and that the check's other arms were not. The button reads "Move and commit" and is on where the plan is not blocked. The field of the broad gate command is not shown.
9. **The form is stated.** `docs/design.md` and `docs/design.ko.md` each gain a row in *Components and their states* for the check's mark on a repository's row, written in place by the build. The English text is under *Data & interfaces*.
10. **The screenshots show the mark and the dialog.** `pnpm run screenshots` gains one view, the dialog of the records place moving the check, with the sidebar's row beside it. The run makes that view last: it commits `workflowText` of an older version into the scene's repository, waits for the row to show the mark, opens the dialog, captures it, and closes it without the commit. The list of views in *A pull request that changes the window carries its screenshots* gains the view in both editions, in place. The run's other views do not change.
11. **Cases hold each item above**, in `apps/desktop/test/records-place.test.ts`, `daemon.test.ts`, `view.test.ts` and the built-app file `records-dialog.test.ts`, as *User scenarios & acceptance* names them.

Out, each with the issue the orchestrator files:

- **Running the new version's check itself against each open pull request before the move.** It is the exact answer to "the new check would refuse", and it needs the app to ship `pr-check/` and to find Python 3.12 on the person's Mac. *Scope* item 6 names what the app's own readers refuse instead. An issue to file.
- **Branches with records that the daemon keeps no work item for**, such as a collaborator's pull request. The daemon reads only the work items it keeps, as its seal reading does. The issue above covers them, since only the check reads a pull request the app did not build.
- **The workflow's failure where neither the tag nor the release branch exists.** A repository pinned to `0.0.5` meets it once `release/v0.0.5` is deleted (*Grounding*). The clone then fails with git's words, and the check posts nothing. The move set out here repairs such a repository from the app of 0.1.0. A sentence in the workflow that says why the clone failed is an issue to file.
- **Moving the pin of a repository whose workflow a person edited** so that `pinnedVersion` reads no version, and of a repository on AgenticSeal's `hygiene.yml`. Neither shows a mark (`frame/questions.md` Q2).
- **Moving a pin to an older version**, where the app is older than the release that wrote the workflow. Nothing is shown.
- **Replacing a daemon of an earlier build after the update.** It is #133's. Until the daemon of the updated app runs, no `olderCheck` is sent, and the row shows nothing.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A. The pin is read | Given `workflowText("0.0.4")`. Then `pinnedVersion` reads `0.0.4`. Given the same text with the release branch's line naming `0.0.3`, or with the clone step removed, or `"name: seal\n"`. Then it reads null. | A case of `records-place.test.ts`, run by name |
| B. Older is decided by numbers | Then `0.0.4` is older than `0.1.0`, `0.0.10` is not older than `0.0.9`, `0.1.0-rc.1` is older than `0.1.0`, `0.1.0` is not older than `0.1.0`, and `main` is neither older nor newer than `0.1.0`. | A case of `records-place.test.ts`, run by name |
| C. The window is told | Given a daemon of version `1.2.3` and a registered repository whose main checkout holds `workflowText("1.2.2")`. When the client reads the inbox. Then the repository's `records.olderCheck` is `1.2.2`. When the workflow's text becomes `workflowText("1.2.3")` and the daemon reads again. Then an `inbox` carries `olderCheck` null. A `hygiene.yml` that runs the check gives null. | A case of `daemon.test.ts`, run by name |
| D. The plan offers the move | Given a repository that holds a root and `workflowText("1.2.2")` committed. When `planRecords` runs for `1.2.3`. Then the plan writes the workflow alone with `workflowText("1.2.3")`, carries `move` from `1.2.2` to `1.2.3`, and the subject is the move's. For `1.2.2` and for `1.2.1` the plan writes no file and carries no move. With the workflow edited in the checkout, the plan is blocked and names the workflow. | Cases of `records-place.test.ts`, run by name |
| E. The move is one commit the person confirmed | Given the plan of D and another file staged. When `setUpRecords` runs with its stamp. Then HEAD is one commit further, holding the workflow alone with the move's subject, the other file is still staged, and nothing is pushed. With a stamp from before a commit, the setup is refused. | Cases of `records-place.test.ts`, run by name |
| F. A failed move leaves the file as it was | Given the plan of D and a `pre-commit` hook that exits 1. When `setUpRecords` runs. Then it throws with the hook's output, the workflow's text is the commit's, and `git status` prints nothing. | A case of `records-place.test.ts`, run by name |
| G. The daemon names records it refuses | Given the repository of C with two work items: one whose branch head holds a round record whose round block the reader refuses, and one with no records. When a client sends `planRecords`. Then the plan's `unread` names the first by id and title, with the reader's sentence, and not the second. | A case of `daemon.test.ts`, run by name |
| H. The row shows the older check | Given a repository whose `records.olderCheck` is `0.0.4`. Then its row holds the button "Check 0.0.4", whose words for a pointer name the version. With `olderCheck` null or absent, the row holds no such button. | A case of `view.test.ts` on the function the row reads, run by name |
| I. The dialog shows the move | Given the plan of D with one `unread` entry. Then `recordsDialog` says both versions, shows the commit's branch and subject, shows the workflow whole with the sentence that it replaces the committed file, names the work item with the reader's sentence and what was read, and hides the field. Its button reads "Move and commit" and is on. A blocked plan with a move has the button off. | Cases of `view.test.ts`, run by name |
| J. The built app moves the pin | Given the built app on a temporary repository that holds the records place with `workflowText("0.0.1")` committed. When the row's "Check 0.0.1" is pressed and then the dialog's button. Then the repository's HEAD holds the workflow of the app's version with the move's subject, and the row's button is gone. | A case of `records-dialog.test.ts`, in the orchestrator's batch of built-app cases |
| K. The form and the screenshots | Given the pull request. Then both editions of `docs/design.md` hold the row and the view, and the pull request's body shows the dialog with the row beside it in Night watch dark and light, and in each other theme that draws a button differently. | The broad gate's count of table rows across the two editions (the orchestrator's), and the review's reading of the screenshots |

## Data & interfaces

`apps/desktop/src/shared/protocol.ts`:

```ts
export interface RecordsPlace {
  // root, check and broadGate as today
  /** The version of Owlery whose pull request check the workflow fetches, where it is older than the daemon's own, and null otherwise: for no Owlery workflow, a workflow whose version line the daemon does not read, a version as new as the daemon's or newer, and a daemon given no version. A daemon of an earlier build sends none, and a client reads its absence as null. */
  olderCheck?: string | null;
}

export interface RecordsPlan {
  // branch, subject, files, blocked, proposedBroadGate and stamp as today
  /** The move of the workflow's pin that the plan's one written file makes, from the version the commit's workflow names to the daemon's, or null where the plan moves nothing. A daemon of an earlier build sends none. */
  move?: { from: string; to: string } | null;
  /** Where the plan moves the pin: each work item of the repository whose records at its branch's head the daemon's readers refuse, with the reader's sentence. Empty where none is refused, and where the plan moves nothing. It is no part of the stamp. */
  unread?: { id: number; title: string; why: string }[];
}
```

`apps/desktop/src/daemon/records-place.ts` gains `pinnedVersion(text: string | null): string | null`, `olderVersion(a: string, b: string): boolean` (whether `a` is older than `b`), and the move's subject as a function of the version (`frame/questions.md` Q1). `apps/desktop/src/daemon/seal-state.ts` gains the reading of *Scope* item 6 beside `workItemSeal`, through the same `workItemDirectory` and `roundBase`. No message is added: the move travels in `planRecords`, `recordsPlan` and `setUpRecords`, as the setup does.

The row of *Scope* item 9, English edition, as the build writes it:

| Part | At rest | Under the pointer | Pressed | Selected | Focused by the keyboard | Disabled |
|---|---|---|---|---|---|---|
| The check's mark on a repository's row | Where the repository's workflow fetches the check of an older Owlery than the app, the repository's row holds, before its "+", the word "Check" and the version in `--font-fact` and `--ink-muted`, as a button on no ground with `--radius-control`. It is neither the signal nor the wax. A press opens the dialog of the records place, which shows the commit that moves the check. | `--hover` under the words, which are in `--ink`. | `--pressed` | — | The ring. | — |

The Korean edition states the same in Korean. The view of *Scope* item 10 is named "the dialog of the records place moving the check" in the English list.

## Rule changes

- change
  file: docs/architecture.md
  section: Records are committed to the repository
  from: The workflow checks out the pull request, fetches `pr-check/` from Owlery's repository at the tag of the release that wrote the workflow, and runs `chain_check.py` against the base branch on Python 3.12 or newer.
  to: The workflow checks out the pull request, fetches `pr-check/` from Owlery's repository at the tag of the release that last wrote the workflow, and runs `chain_check.py` against the base branch on Python 3.12 or newer.
- change
  file: docs/architecture.ko.md
  section: 기록은 저장소에 커밋합니다
  from: 워크플로는 PR을 체크아웃하고, 그 워크플로를 쓴 릴리스의 태그에서 Owlery 저장소의 `pr-check/`를 받아, Python 3.12 이상에서 `chain_check.py`를 기준 브랜치에 대해 실행합니다.
  to: 워크플로는 PR을 체크아웃하고, 그 워크플로를 마지막으로 쓴 릴리스의 태그에서 Owlery 저장소의 `pr-check/`를 받아, Python 3.12 이상에서 `chain_check.py`를 기준 브랜치에 대해 실행합니다.
- add
  file: docs/architecture.md
  section: Records are committed to the repository
  to: **A repository whose workflow fetches the check of an older Owlery than the app says so on its row, and a commit the person reads first moves the check.** The daemon reads the version in the clone step of Owlery's workflow, in the main checkout's working tree, each time it reads the repository's records place. Where that version is older than the daemon's own, the repository's row in the sidebar names it. The dialog of the records place then shows the workflow as the app writes it, whole, with the commit's subject and its branch, and the app writes nothing until the person confirms. The commit replaces the workflow and holds it alone, runs the repository's hooks, and is not pushed. The app refuses the move while the checkout does not hold the workflow as its commit does. Before the commit, the dialog names each work item of the repository whose records at its branch's head the app's readers refuse, with the reader's sentence. Those readers are the ones of the round records, the broad gate's run and the guarantee, which cases hold to the check's answers, and the check's other arms are not read there. The app offers no move for a workflow whose version it does not read, for a version as new as the app's or newer, and for AgenticSeal's `hygiene.yml`. A daemon of an earlier build reads no version, so the row names an older check once the daemon of the updated app runs.
    check: apps/desktop/test/records-place.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts apps/desktop/test/records-dialog.test.ts
- add
  file: docs/architecture.ko.md
  section: 기록은 저장소에 커밋합니다
  to: **워크플로가 앱보다 오래된 Owlery의 검사를 받는 저장소는 자기 줄에 그것을 알리고, 사람이 먼저 읽은 커밋 하나가 그 검사를 옮깁니다.** 데몬은 저장소의 기록 자리를 읽을 때마다, 메인 체크아웃의 작업 트리에 있는 Owlery 워크플로의 클론 단계에서 버전을 읽습니다. 그 버전이 데몬 자신의 버전보다 오래되었으면 사이드바의 저장소 줄이 그 버전을 보여 줍니다. 그러면 기록 자리의 대화 상자가 앱이 쓰는 워크플로 전체와 커밋 제목, 커밋이 올라갈 브랜치를 보여 주고, 앱은 사람이 확인하기 전에는 아무것도 쓰지 않습니다. 커밋은 워크플로를 통째로 바꾸고 그 파일만 담으며, 저장소의 훅을 그대로 돌리고, 푸시하지 않습니다. 체크아웃이 워크플로를 그 커밋과 같게 갖고 있지 않은 동안에는 옮기지 않습니다. 커밋하기 전에 대화 상자는, 브랜치 끝의 기록을 앱의 읽기 도구가 거절하는 저장소의 작업을 하나하나 그 도구의 문장과 함께 알립니다. 그 도구는 회차 기록, 전체 검사의 실행, 보증서를 읽는 것이고, 케이스가 그 답을 검사의 답에 묶어 둡니다. 검사의 다른 갈래는 거기서 읽지 않습니다. 앱이 버전을 읽지 못하는 워크플로, 앱의 버전과 같거나 더 새로운 버전, AgenticSeal의 `hygiene.yml`에는 옮기기를 내놓지 않습니다. 이전 빌드의 데몬은 버전을 읽지 않으므로, 저장소 줄은 업데이트한 앱의 데몬이 돌 때부터 오래된 검사를 알립니다.
    check: apps/desktop/test/records-place.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts apps/desktop/test/records-dialog.test.ts

## Removes

This work adds a mark, the check's button on a repository's row, and a second kind of plan beside the setup's plan and commit. No code moved a pin before it (*Grounding*), so no mechanism goes in return. The mark answers no blocked step: it names a fact the daemon reads, a pin older than the app, and it leaves the row as soon as that fact stops holding. The setup's plan, its stamp, its blocking arms and its commit runner are reused rather than copied.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The sentence that the plan keeps Owlery's workflow wherever the commit holds it | `apps/desktop/src/daemon/records-place.ts#planRecords`, its docstring's sentence "The workflow that is kept is Owlery's where the commit holds it as a file …" | Rewritten in place: it is kept, unless the plan writes no other file and the commit's text pins an older version, where the plan moves it (*Scope* item 4). |
| The docstring's claim that the commit "replaces no file" and that each file is created only where nothing stands | `apps/desktop/src/daemon/records-place.ts#setUpRecords` | Rewritten in place to hold for the setup's files, with the move as the one file written over (*Scope* item 5). |
| The comment that a file's `text` is null "for a file the commit holds, which is kept" | `apps/desktop/src/shared/protocol.ts`, `RecordsPlan.files` | Rewritten in place: a plan with a move gives the committed workflow a text. |

Framed 2026-11-26 by framer, before the build.
