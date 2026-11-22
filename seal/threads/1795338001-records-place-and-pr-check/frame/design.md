# Design: connecting a repository creates the records place and the PR check, and the records hold a work item's decisions and questions

The ticket is issue #40. A person points the app at a folder and gets work items, and nothing is created in the repository: no place for work records and no check that reads them outside the app. The issue asks that connecting a repository creates both in one step the person reads before it is committed, that an existing AgenticSeal root and its check are kept, that the broad gate command is set in the same step, that the check runs on GitHub without the app, and that `docs/architecture.md` says whether AgenticSeal's scripts are adapted or rewritten.

Two decisions of the owner's, made on 2026-11-22 after the issue was written, are part of this work. The first: a work item's records are the one source of the decisions made for it without asking and of the questions that park it, and the format of those records is this work's. The second: Owlery owns what it took from AgenticSeal and follows no release of AgenticSeal, so the text of `docs/architecture.md` on AgenticSeal, the role bundle's notice and the case that binds the bundle to AgenticSeal's tag are rewritten here.

## Grounding

The tree as read at `dd938de`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Records are committed to the repository* | Records are always committed. Connecting creates the place for records and the PR check together, and the person is not asked where the records go. A repository that cannot hold work records in its tree is not what Owlery is for |
| `docs/architecture.md` *State lives in three places* | The repository holds all work records, and the daemon holds what changes often. The row of the daemon lists "questions and answers", which the owner's first decision moves into the repository's records |
| `docs/architecture.md` *What we take from AgenticSeal* | Owlery does not depend on AgenticSeal to run. The row on the scripts says the choice between adapting and rewriting is not decided. The record formats are the product's, and the first version matches AgenticSeal's |
| `docs/architecture.md` *What changes because Owlery is not a plugin*, the sentence "The PR check stays." | The check runs outside Owlery, so a colleague without the app gets the same verdict |
| `docs/architecture.md` *Taking in AgenticSeal's changes*, *Compatibility with AgenticSeal* and the row "Compatibility with the AgenticSeal record format" of *Open decisions* | Each states that Owlery follows AgenticSeal's releases or leaves the formats' compatibility open. The owner's second decision replaces all three |
| `docs/product.md` *What we deliberately don't do* | There is no mode that leaves records uncommitted, and a repository that cannot keep work records in its tree is out of scope. Owlery deletes nothing of a person's work without that person's word |
| `docs/roadmap.md` *Milestones* row 2 and *Open decisions*, the row "PRs from outside contributors" | The seal is a GitHub check. The check judges only the pull requests that declare a work item, so an outside pull request passes it unjudged |
| The plugin's `skills/core/SKILL.md` *The rule a mechanism is kept against* | A fact has one source, a script holds a gate only on a fact it reads exactly, and it names what it did not read. This is the ground of one record for the decisions and of a block with fixed fields |

**Facts of the tree and of probes.** Each is labelled with how it was established. The probes ran in the scratch directory `1795338001-records-place-and-pr-check/frame-2/` of the session's scratchpad, in a repository made there, and never in a checkout of Owlery.

- **Nothing in the tree writes into a person's repository or makes a commit.** Executed: `git grep -n -i "broad gate\|seal/\|Seal-Routing\|hygiene\|chain_check" dd938de -- apps/desktop/src` prints nothing. Read: the daemon's uses of `git` in `apps/desktop/src/daemon/worktrees.ts` are reads, `worktree add`, `worktree remove`, `branch -D`, `branch -m` and `fetch`.
- **A repository is connected today in two ways, and neither touches its tree.** Read: `apps/desktop/src/daemon/daemon.ts`, the case `addRepository` (line 406), and the case `createWorkItem` (line 351), whose `RepositoryStore#addWorkItem` adds the repository of the folder where the store does not keep it.
- **The daemon reads each work item's branch in one pass, and a request that tells a person what it would do carries a stamp.** Read: `daemon.ts#readCommits` (line 1207) and `#readBranch` (line 1224); `worktrees.ts#readLoss` (line 772), whose `stamp` the delete compares.
- **This repository holds an AgenticSeal root and its check.** Read: `seal/README.md` opens with the line `# What AgenticSeal maintains in seal/`; `seal/config.json` holds `Broad gate` and the two language keys; `.github/workflows/hygiene.yml` clones AgenticSeal at `v0.38.2` and runs `chain_check.py`; `.github/workflows/check.yml` runs `pnpm -r run check` on `macos-latest`.
- **`chain_check.py` of AgenticSeal 0.38.4 loads with the files *Scope* item 1 lists and no other.** Executed: `sh test_tmp_check.sh`, which copied those files alone from the installed plugin and ran the check from the copy.
- **The check passes a ready pull request that declares nothing, with a root and without one.** Executed, the same probe: with the payload `{"pull_request":{"draft":false,"body":"hello"}}` in `GITHUB_EVENT_PATH`, `chain_check.py --baseline main` printed "this pull request declared neither way, so the review-chain check examined nothing" and exited 0 in both repositories.
- **The check can fail.** Executed, the same probe: a branch whose `routing.md` declares `through the review chain` and holds no round record exited 1 under the ready payload and 0 under a draft payload.
- **A declared work item's pull request is refused where the root's `config.json` names no language.** Executed, the same probe: the refusals name the keys `Commit and pull request language` and `Record language`.
- **Neither 0.38.4 nor 0.38.2 reads a `decisions.md`.** Executed: the same branch with a `decisions.md` holding the two blocks of *Data & interfaces* gave the same exit and the same output under 0.38.4, and under 0.38.2, cloned from its tag, the output does not name the file.
- **The check maps a branch to its work item by the `Branch` row of `routing.md`.** Read: `chain_check.py#declared_for_this_branch` and `lib/routing.py#item_dir`: one declaration names the branch, and two that name one branch resolve to nothing.
- **A `seal` block's value is one line.** Read: `lib/fields.py`, whose `_block` reads each line of a block as `<key>: <value>` and refuses a blank line.
- **AgenticSeal's settle reads no decision.** Read: `skills/settle/scripts/settle.py#open_rows` reads the open rows of `## Not verified` alone.
- **A commit that names paths leaves the other staged work staged.** Executed, the same probe: with `y` staged, `git add -- z` and `git commit -m … -- z` committed `z` alone and `git status --short` still printed `A  y`.
- **Owlery's repository and AgenticSeal's are public, and Owlery's holds the one tag `v0.0.1`.** Executed: `gh repo view … --json visibility` printed `PUBLIC` for each, and `git tag` printed `v0.0.1`.
- **AgenticSeal needs Python 3.12 or newer.** Read: the plugin's `README.md` line 51. Executed: `python3 --version` printed 3.12.11 on this machine.
- **The role bundle's cases pin the list of its files, and its notice pins the tag.** Read: `apps/desktop/test/role-bundle.test.ts` lines 58 and 83; `apps/desktop/role-bundle/README.md` lines 9, 23, 35 and 44 to 52.
- **#38's design states a rule change on following AgenticSeal's releases.** Read: `seal/threads/1795329620-role-bundle/frame/design.md` *Rule changes*, the two `add` operations whose section is *Taking in AgenticSeal's changes* and *AgenticSeal의 변경을 가져오는 법*.
- **Issue #128, the notice of a new AgenticSeal release, is closed as not planned.** Executed: `gh issue view 128 --json state,stateReason`.
- **The issue has no comment.** Executed: `gh issue view 40 --json body,comments`.
- **The absence searches of the *Verifiable how* cells were run at `dd938de`.** Executed. Each prints only the lines the scope item beside it rewrites. `git grep -n -F 'take the code and adapt it or to rewrite it is not decided' dd938de -- docs` prints `docs/architecture.md:133`, and the same search for `코드를 가져와 고칠지 다시 짤지는 정하지 않았습니다` prints `docs/architecture.ko.md:133` (*Scope* item 4). For `Compatibility with the AgenticSeal record format` and `AgenticSeal 기록 형식과의 호환` it prints line 357 of each edition, and for `Whether to keep this compatibility is not decided` and `이 호환을 계속 지킬지는 정하지 않았습니다`, line 181 of each (item 3). For `questions and answers` and for `질문과 답` it prints lines 150 and 163 of each edition (item 18). `git grep -n -F 'byte for byte' dd938de -- apps/desktop/role-bundle docs` prints `apps/desktop/role-bundle/README.md:23`, and `git grep -n -F 'is decided by issue #40' dd938de -- apps` prints `apps/desktop/role-bundle/README.md:35` (item 5).

**Nobody's finding.** The role bundle's notice gives the commit of AgenticSeal's tag `v0.38.4` as `0eca6e7`. The crafter of phase 1 read it with `git ls-remote`: `0eca6e77215262e2609f2d7f2894215faa1d7423` (folded by the orchestrator, 2026-11-22).

`routing.md` *Why this way* says that a question only the owner can answer is posted on the issue. The owner's rule of the same day, which the spawn carries, is that Owlery posts no question on a GitHub issue. The frame follows the rule, and the routing record is the orchestrator's to correct.

## Scope

**In.** Items 1 to 6 are the check and the ownership of what was taken, items 7 to 12 the connection, and items 13 to 19 the record of decisions and questions. The exact shapes and texts are in *Data & interfaces*.

1. **The check's scripts are taken into `pr-check/` at the top of the repository, as Owlery's own copy.** The folder holds the 19 files `chain_check.py` loads, each at the path it has in AgenticSeal 0.38.4: under `lib/`, `sibling.py`, `lines.py`, `blocks.py`, `fields.py`, `gitcmd.py`, `optin.py`, `console.py`, `config.py`, `gate.py`, `routing.py`, `tables.py`, `items.py` and `gaps.py`; under `skills/code-review/scripts/`, `chain_check.py` and `pr_body.py`; under `skills/settle/scripts/`, `rule_changes.py` and `passages.py`; under `.github/scripts/`, `rules.py` and `close_issues_on_release.py`. This work changes none of them. `pr-check/LICENSE` is AgenticSeal's licence text, and `pr-check/README.md` says what the folder is, that the workflow of a connected repository fetches it, that its files started from AgenticSeal 0.38.4 under the MIT License, and that they are Owlery's to change. The app does not ship the folder.
2. **Cases run the taken check as GitHub runs it.** `apps/desktop/test/pr-check.test.ts` runs `python3` on `pr-check/skills/code-review/scripts/chain_check.py` in temporary repositories, with a pull request's payload in `GITHUB_EVENT_PATH`. `.github/workflows/check.yml` gains a step that sets up Python 3.12 before the checks, because the suite now needs it.
3. **`docs/architecture.md` says that what Owlery took is its own and that it follows no release of AgenticSeal, in both languages.** The entries P1, P3, P4 and P5 of *Data & interfaces* are written into *What we take from AgenticSeal*, *Taking in AgenticSeal's changes*, *Compatibility with AgenticSeal* and *Open decisions*, and into the same sections of `docs/architecture.ko.md`.
4. **`docs/architecture.md` names the choice for the check in place of "not decided", in both languages.** Entry P2: the check takes AgenticSeal's code and Owlery adapts it from there, and the daemon runs no Python.
5. **The role bundle's notice and cases stop binding the bundle to AgenticSeal's tag.** `apps/desktop/role-bundle/README.md` keeps what the folder is, the notice of where its files started, the licence, and what the bundle leaves out. It loses the table of the files taken, the section *What Owlery changed* with its claim that the other files are byte for byte the tag's, and the section on taking in a later release. Its sentence that issue #40 decides the scripts names `pr-check/`. In `apps/desktop/test/role-bundle.test.ts` the case that pins the list of the bundle's files is removed: the bundle's other cases already read its manifest, its `LICENSE` and its `README.md`, and fail where one is missing (phase 1, folded by the orchestrator). The case on the licence and the notice stays.
6. **#38's rule change on following AgenticSeal's releases is taken out of its design.** The two `add` operations named in *Grounding* leave `seal/threads/1795329620-role-bundle/frame/design.md` *Rule changes*, so the settle of release 0.0.2 does not write a rule this work replaced. The design's other operations stay.
7. **A repository the daemon keeps carries what its main checkout holds of the records place.** `Repository` gains `records`: the root's name, the path of the check's workflow, and the broad gate command, each null where the checkout holds none. The daemon reads them from the working tree of the repository's folder in the pass that reads the work items' branches, at the repository's addition, and after a setup.
8. **`planRecords` answers what a setup would write, and writes nothing.** The plan names the branch the commit would land on, the commit's subject, each file with its whole text or as kept, a reason where the setup cannot run, and a stamp.
9. **`setUpRecords` writes the files and commits them, after the person read the plan.** The daemon makes the plan again and refuses where its stamp is not the one the message carries. It creates each file only where nothing stands at its path, stages those paths alone and commits those paths alone, on the branch the checkout stands on, with the person's git identity and the repository's hooks. It pushes nothing. Where the commit fails, the daemon unstages those paths, removes the files and the folders this request created, and answers with git's words.
10. **What the repository has committed is kept.** The root is the folder `seal/`, or `agentic-seal/`, whose `README.md` opens with the marker line. Where one stands, its `README.md` and its `config.json` are kept as they are. The workflow is written only where neither `.github/workflows/owlery-seal.yml` nor an AgenticSeal `hygiene.yml` stands, and a `hygiene.yml` is AgenticSeal's where it runs the script `skills/code-review/scripts/chain_check.py`, not by its name. The plan is made from the commit the checkout stands at, because that is what a clone and the check on GitHub get, and a file is kept only where that commit holds it as a file. The checkout then has to hold the place as the commit does, since the setup writes into the checkout and the daemon reads the place from it. It is compared at the files the plan keeps or writes (by content hash for a kept file), at the Owlery workflow, and at everything under a root to be made; the other root name's `README.md` and a `hygiene.yml` the plan does not keep are read only for the marker and for the check step. Where it differs at one of those, changed, removed, staged, untracked, ignored, behind a link or left out of a sparse checkout, the plan is `blocked` and names each such path. So this repository's setup writes no file, and the plan says so.
11. **The broad gate command is set in the same step, and the app shows where it is kept.** The plan takes the command the person typed and writes it as the `Broad gate` key of the root's `config.json`, with the two language keys the check asks for, both `English`. A setup that writes `config.json` refuses an empty command. Where `config.json` stands already, the field is off and the dialog shows the key's value, or says that the file holds no such key.
12. **The window shows the setup as a dialog, and says before anything is written what is out of scope.** The dialog opens when a registration's answer arrives for a repository that lacks a part of the place, and from the entry "Records and check…" of the repository's menu at any time. It says that Owlery commits work records to this repository and that a repository that cannot keep work records in its tree is out of scope, lists each file with its text, names the branch and the subject, and holds the field for the broad gate command. For a repository that holds every part it shows the root, the workflow and the broad gate command with the file that holds it, and no button to commit. A plan is `blocked`, and the dialog shows why, in nine cases, in this order: no root name is free, a file of the plan is ignored, a record path is ignored, the root's `threads` is not a folder in the commit, the index or the checkout, something other than a folder stands at a folder above a path the plan writes in the checkout, the index or the commit, the same name stands in other letters on a case-insensitive disk, the commit holds something other than a file where the setup writes one, the checkout differs from the commit (*Scope* 10), and, for a plan that writes a file, no branch is checked out. Where none of the nine holds and git cannot say whether it ignores a record path, no plan is made, and the dialog shows git's words alone, also for a repository that holds every part.
13. **A work item's decisions and questions live in `decisions.md` of its directory, as `seal` blocks.** The work item's directory is the one under `<root>/threads/` in its worktree whose `routing.md` names the work item's branch in its `Branch` row. Where none does, or more than one, the work item has no directory, as the check reads it.
14. **`apps/desktop/src/daemon/record-blocks.ts` is the daemon's reader and writer of a `seal` block.** It reads a text for the blocks of the kinds it is given, returns each block whose every line parses, and names each refusal and each notice at its line, by the grammar of `pr-check/lib/fields.py` and the walk of `pr-check/lib/blocks.py`. It adds one count to that grammar, a key a block may hold any number of. A case reads the same fixtures through both readers and compares them.
15. **A decision block holds an id, the kind, what was decided, the grounds, who decided where it is said, and the state.** The kinds are `route`, `default`, `scope` and `answered`. The states are `decided`, `reversed`, `applied` with a commit and `carried` with a home. A block that is not `decided` holds the person's message in `reversal:`.
16. **A question block holds an id, what is asked, the grounds, who asks where it is said, the options, the default, and the state.** The states are `open` and `answered`, and an answered block holds the answer in `answer:`.
17. **`apps/desktop/src/daemon/decision-record.ts` reads a record and writes each change of one.** It finds the work item's directory, reads `decisions.md` into decisions, questions, refusals and notices, and holds one function for each write: a new decision, a new question, a reversal, an answer, `applied` and `carried`. Each write changes one block and leaves every other line of the file as it is. Each refuses a change the states do not allow.
18. **The rules on the record are written into `docs/architecture.md`, in both languages.** Entries P9 to P12: where the decisions and the questions live, their fields and states, that what the person has seen is the daemon's state, that a `reversed` decision and an `open` question are open rows of the record, and that a release's pull request lists the release's decisions.
19. **The connection's rules are written into `docs/architecture.md`, in both languages.** Entries P6 to P8.

**Out, each with its home.**

20. **The wiring of the record into the daemon and the inbox is #119's.** `Daemon#decided` and `Daemon#park` write a block through item 17, `reverseDecision` and `answerQuestions` write the person's word into the record, the daemon reads each work item's record in the pass of item 7 and sends it with the work item, the daemon keeps what the person has seen, and the daemon commits the records alone where no stage runs. `frame/plan.md` *Overlap with the release* names what #119 keeps and what it replaces.
21. **Who writes a decision block and a question block in a run.** #41's rounds and fix passes and #42's gate and sealer write them through item 17, and #51's orchestrator session writes its route. Each stage commits the record with its own commit. Creating a work item's directory and its `routing.md` is the first stage's: #41 for "Get a seal", #51 for an issue handed over.
22. **The seal while a decision stands `reversed`.** A reversal written after the seal is a commit outside the closing records, so the taken check already fails the pull request (`chain_check.py`, the guarantee arm). Whether the sealer withholds while a decision is `reversed` before the seal is #42's.
23. **A release's pull request that lists its decisions.** The rule is written here (item 18). The first such pull request is #49's, which reads every `decisions.md` under `seal/threads/` at the release branch's head.
24. **A settle that keeps a directory with an open decision row.** AgenticSeal's `seal settle --apply` does not read `decisions.md` (*Grounding*). Until Owlery has a settle of its own, whoever settles this repository holds the rule by running the search of P10. No issue carries Owlery's settle yet, and the report names this.
25. **Rewording the taken check's refusals.** They name `seal gate`, the orchestrator and AgenticSeal's templates. Each issue that builds a stage rewrites what its stage prints: #41, #42 and #43.
26. **Moving the pin of a connected repository's workflow** when the app updates. The workflow fetches the check at the release that wrote it. No issue carries the move, and the report names this.
27. **The check's name on GitHub for the required check**, and the README's sentence on it, are #43's. It reads `Repository.records.check` to say which workflow a repository runs.
28. **Asking the record language at the connection.** `frame/questions.md` Q2 holds it.

**Where each line of the issue's *Done when* lands.** The lines are numbered in the issue's order.

| Line | Lands |
|---|---|
| 1, one step the person reads before it is committed | Items 8, 9 and 12 |
| 2, an existing AgenticSeal root and its check are not overwritten | Item 10 |
| 3, the broad gate command is set, and the app shows where | Items 7, 11 and 12 |
| 4, the check runs on GitHub without the app, and passes a pull request that declares no work item | Items 1 and 2, and the workflow of item 9 |
| 5, the app says up front what is out of scope | Item 12 |
| 6, the choice is written into `docs/architecture.md` | Item 4 |

## User scenarios & acceptance *(mandatory)*

Each case is seen red before its code, as contract rule 15 states. `test/` is `apps/desktop/test/`.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. An outside pull request passes | Given a repository with the records root and a branch no `routing.md` names. When the taken check runs with a ready pull request's payload. Then it exits 0 and prints that it examined nothing | A case of `test/pr-check.test.ts`, and the same in a repository with no root |
| 2. The check can fail | Given a branch whose `routing.md` declares `through the review chain` and no round record. When the check runs with a ready payload, and with a draft payload. Then it exits 1 and names `routing.md`, and exits 0 for the draft | A case of `test/pr-check.test.ts` |
| 3. The check does not read `decisions.md` | Given the branch of scenario 2 with a `decisions.md` holding a `reversed` decision and an `open` question. When the check runs. Then its exit and its output are those of scenario 2 | A case of `test/pr-check.test.ts` |
| 4. The folder is whole and carries its origin | Given `pr-check/`. Then it holds the files of *Scope* item 1, `LICENSE` opens with `MIT License` and holds AgenticSeal's copyright line, and `README.md` names AgenticSeal, its address, the release 0.38.4 and the licence | A case of `test/pr-check.test.ts` |
| 5. The documents state the ownership and the choice | Given both editions of `docs/architecture.md`. Then they hold P1 to P5, and the broad gate's comparison of headings and of table lines passes | The orchestrator's broad gate. `git grep -n -F <string> -- docs`, for each string *Grounding* names beside *Scope* items 3 and 4, prints nothing |
| 6. The bundle is an owned copy | Given the role bundle. Then its notice names AgenticSeal, its address, the release it started from and the licence, and no case names a fixed list of its files | `test/role-bundle.test.ts`. `git grep -n -F 'byte for byte' -- apps/desktop/role-bundle docs` and `git grep -n -F 'is decided by issue #40' -- apps` print nothing |
| 7. A plan writes nothing | Given a repository with no root. When a client sends `planRecords` with a command. Then the `recordsPlan` names the branch, the subject, each file of the place with its text, no `blocked` and a stamp, and `git status --porcelain` prints nothing | A case of `test/records-place.test.ts`, and one of `test/daemon.test.ts` over the message |
| 8. A setup is one commit of its files alone | Given the plan of scenario 7, and another file staged in the checkout. When the client sends `setUpRecords` with the plan's stamp. Then HEAD is one commit further, the commit holds the plan's files alone with the subject, the other file is still staged, and the `inbox` that follows carries `records` with the root, the workflow and the command | A case of `test/records-place.test.ts`, and one of `test/daemon.test.ts` |
| 9. A setup the person did not read is refused | Given a plan. When a commit lands in the checkout and the client then sends `setUpRecords` with the old stamp. Then the daemon answers `error`, and the tree holds no file of the setup | A case of `test/daemon.test.ts` |
| 10. An AgenticSeal root and its check are kept | Given a repository that commits `seal/README.md` with the marker, a `config.json` with `Broad gate`, and `.github/workflows/hygiene.yml` holding a line that runs `skills/code-review/scripts/chain_check.py`. When a client sends `planRecords`. Then every file of the plan is kept, and `setUpRecords` changes no file and makes no commit | A case of `test/records-place.test.ts` |
| 11. A project's own `seal/` is left alone | Given a repository with a `seal/` whose `README.md` does not open with the marker. When a client sends `planRecords`. Then the plan writes the root at `agentic-seal/`, and nothing under `seal/` | A case of `test/records-place.test.ts` |
| 12. A repository that cannot keep records is told so | Given a repository whose `.gitignore` holds `seal/`, and one with a detached HEAD. When a client sends `planRecords`. Then each plan is `blocked` with the reason, and `setUpRecords` answers `error` and writes nothing | Cases of `test/records-place.test.ts` |
| 13. A failed commit leaves nothing | Given a repository whose `pre-commit` hook exits 1. When a client sends `setUpRecords`. Then the daemon answers `error` with the hook's output, no file of the setup stands, and nothing of it is staged | A case of `test/records-place.test.ts` |
| 14. The written workflow runs the check that stands in the tree | Given the workflow text for a version. Then it clones Owlery's repository at the tag `v<version>` and falls back to the branch `release/v<version>`, and the script it runs is a file under `pr-check/` | A case of `test/records-place.test.ts` |
| 15. The written root is one the check reads | Given a repository after the setup of scenario 8, and a branch that declares a work item with no round record. When the taken check runs with a ready payload. Then it exits 1 and names no key of `config.json` | A case of `test/pr-check.test.ts` |
| 16. The dialog says what is out of scope and shows the plan | Given a plan. Then the dialog's text holds the sentence on the repository that cannot keep work records in its tree, each file's path and text, the branch and the subject. Given a repository that holds every part. Then it shows the root, the workflow and the command, and offers no commit | Cases of `test/view.test.ts` over the function that gives the dialog's words |
| 17. A registration opens the dialog | Given the built app. When a person registers a repository with no root. Then the dialog opens with the plan, and "Set up and commit" makes the commit | One case that starts the built app, in a test file of its own |
| 18. The two readers agree | Given fixtures: a block alone, a block inside another fence, a fence that never closes, a line that begins `<!--`, an indented fence, an opener with a word after `seal`, a blank line inside a block, a line that is no field, a key twice, and a block that lacks a key. When `record-blocks.ts` and `pr-check/lib/fields.py` each read every fixture for the verdict kind and the run kind. Then they return the same blocks, and refusals and notices at the same lines | A case of `test/record-blocks.test.ts` that runs `python3` |
| 19. A record is read | Given a `decisions.md` with a decision in each state and a question in each state. Then the reader returns each with its fields. Given a block with an id another block above holds, a `reversal:` on a `decided` block, a `default:` that names no option, and an `answered` block with no `answer:`. Then each is refused at its line and not returned, and the blocks around it are | Cases of `test/decision-record.test.ts` |
| 20. Each write changes one block | Given a record. When a decision is added, reversed and applied, and a question is added and answered. Then the text read again holds the new state, every other line is the same, and the new block's id is one above the highest. A reversal of a block that is not `decided`, and an answer to one that is not `open`, throw and change nothing. A message of several lines is written as one | Cases of `test/decision-record.test.ts` |
| 21. A work item's directory is found by its branch | Given a worktree whose `seal/threads/` holds two directories, one whose `routing.md` names the branch. Then that one is the work item's. Given two that name it, or none. Then there is none | Cases of `test/decision-record.test.ts` |
| 22. The documents state the connection and the record | Given both editions of `docs/architecture.md`. Then they hold P6 to P12 | The broad gate. `git grep -n -F 'questions and answers' -- docs` and `git grep -n -F '질문과 답' -- docs` print nothing |

## Data & interfaces

### The protocol, `apps/desktop/src/shared/protocol.ts`

```ts
/** What a repository's main checkout holds of the place for work records, as the daemon last read its working tree. */
export interface RecordsPlace {
  /** The root's folder from the top of the repository, `seal` or `agentic-seal`, or null where none stands. */
  root: string | null;
  /** The path of the workflow that runs the check, or null where none stands. */
  check: string | null;
  /** The value of the `Broad gate` key of the root's `config.json`, or null where there is no root, no file, or no such key. */
  broadGate: string | null;
}

/** What a setup of the records place would do. */
export interface RecordsPlan {
  /** The branch the commit lands on, or null where the checkout stands on none. */
  branch: string | null;
  /** The commit's subject. */
  subject: string;
  /** Each file of the place in the order README, config, workflow: `text` is what the setup writes, or null for a file the commit holds, which is kept. */
  files: { path: string; text: string | null }[];
  /** Why the setup cannot run, as a sentence the window shows as it is, or null. */
  blocked: string | null;
  stamp: string;
}
```

`Repository` gains `records: RecordsPlace`. A daemon of an earlier build sends none, and a client reads its absence as a repository it offers no setup for.

`ClientMessage` gains `{ type: "planRecords"; requestId: number; id: number; broadGate: string }` and `{ type: "setUpRecords"; requestId: number; id: number; broadGate: string; stamp: string }`, where `id` is a repository's. `ServerMessage` gains `{ type: "recordsPlan"; requestId: number; id: number; plan: RecordsPlan }`. `setUpRecords` is answered with `done`, before the `inbox`. Each is answered with `error` for an id the daemon does not keep.

### The connection, `apps/desktop/src/daemon/records-place.ts`

- **The root.** `seal` where the commit holds `seal/README.md` as a file that opens with the marker; else `agentic-seal` where the commit's `agentic-seal/README.md` does; else none. The marker is the line `# What AgenticSeal maintains in seal/`, compared whole with only its line end taken off, as `pr-check/lib/optin.py#MARKER` reads it. A new root is the first of the two names at or under which the commit holds nothing, and the plan is `blocked` where the commit holds something at or under both.
- **The files.** `<root>/README.md`, `<root>/config.json` and `.github/workflows/owlery-seal.yml`. The first two are kept where the root stands, each written only where it does not stand. A kept file is one the commit holds as a file. The third is kept where the commit holds `.github/workflows/owlery-seal.yml`, or where the commit's text of `.github/workflows/hygiene.yml` holds the line that runs `skills/code-review/scripts/chain_check.py`, told by its content and not by its name, and the plan then lists the one the commit holds. The paths at which the checkout is compared with the commit (*Scope* 10) are the files the plan keeps or writes, compared by content hash for a kept file, the Owlery workflow and everything under a root to be made; the other root name's `README.md` and an unkept `hygiene.yml` are read for the marker and the check step only.
- **The subject.** `chore: add the place for work records and the pull request check`.
- **The stamp.** The SHA-256 of the JSON of HEAD's commit, the branch and the plan's files, as `WorkItemLoss.stamp` is made.
- **The commit.** `git add -- <the written paths>`, then `git commit -m <subject> -- <the written paths>`, each run in the repository's folder with no option that skips a hook or a signature.
- **The version.** The composer of the workflow takes the version as an argument. The daemon passes the one `apps/desktop/package.json` holds, which the build gives it from that file and from nowhere else.

`<root>/README.md`:

```
# What AgenticSeal maintains in seal/

Owlery keeps the work records of this repository here, and commits them. The first line of this file is the marker the pull request check reads: leave it as it is.

- `config.json` holds what this repository says about itself. `Broad gate` is the command that must pass on a commit before it is sealed. `Commit and pull request language` and `Record language` name the language of commits and of records.
- `threads/<work-item-id>/` holds one work item's records: how it was routed, its design, its review rounds, the broad gate's run, the verdict, and `decisions.md`, the decisions made for it without asking and the questions it was parked with.

The check runs on every pull request from `.github/workflows/owlery-seal.yml`. It judges a pull request whose branch a `routing.md` under `threads/` names, and passes every other one unjudged.
```

`<root>/config.json`, with the command the person typed, trimmed:

```json
{
  "Commit and pull request language": "English",
  "Record language": "English",
  "Broad gate": "<command>"
}
```

`.github/workflows/owlery-seal.yml`, with `<version>` written as the version:

```yaml
# The pull request check of Owlery: a pull request that declares a work item
# carries the records it owes, and a ready one carries a seal at its head.
# A pull request that declares no work item is not judged.
# Owlery wrote this file when the repository was connected. It fetches the
# check from Owlery's repository at the release that wrote it. The line moves
# when a person edits it.

name: seal

on:
  pull_request:
    # A draft made ready and a body edited make no commit, so each is named.
    types: [opened, synchronize, reopened, edited, ready_for_review, converted_to_draft]

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.run_id }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  seal:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # the check reads the commits since the base branch

      # The release's tag, or the release's branch until the tag exists.
      - name: the check, at Owlery <version>
        shell: bash
        run: |
          git clone --quiet --depth 1 --branch v<version> \
            https://github.com/MichaelYcJo/owlery.git "$RUNNER_TEMP/owlery" \
          || git clone --quiet --depth 1 --branch release/v<version> \
            https://github.com/MichaelYcJo/owlery.git "$RUNNER_TEMP/owlery"

      - name: a declared work item carries the records it owes
        shell: bash
        run: |
          python3 "$RUNNER_TEMP/owlery/pr-check/skills/code-review/scripts/chain_check.py" \
            --baseline "origin/${{ github.base_ref }}"
```

**The dialog's words** come from one pure function of `apps/desktop/src/renderer/view.ts`, which the cases of scenario 16 read. Its sentences: "Owlery commits work records to this repository. A repository that cannot keep work records in its tree is out of scope for Owlery."; for a plan with a file to write, "This makes one commit on `<branch>`: `<subject>`. Nothing is pushed.", each file's path over its text, and for a kept file "`<path>` stands and is kept."; for a blocked plan with nothing to write, the file list and the refusal sentence; the field's label "Broad gate command", with under it "Kept in `<root>/config.json`, under `Broad gate`."; the buttons "Set up and commit" and "Not now". For a repository that holds every part: "Records: `<root>/`", "Check: `<path>`", and "Broad gate: `<command>`, kept in `<root>/config.json` under `Broad gate`", or "No `Broad gate` key in `<root>/config.json`." where the file holds none.

### The block grammar, `apps/desktop/src/daemon/record-blocks.ts`

A block is a fenced code block outside every other fence, whose opener is the line of three backticks and `seal` and nothing else. Each line inside it is `<key> <value>`, the key spelt with its colon, or the key alone where its shape takes nothing. The first line's key names the block's kind. A key's count is one, at most one, or any number, which is the count this module adds. A block is refused at its line, and not returned, for a blank line, a line that is no field of its kind, a key over its count, a value that does not match its key's shape whole, a missing key of count one, and a first line that opens no kind given. Outside a block the reader refuses a fence that never closes, a line that begins `<!--`, and a fence line it cannot place, and it names as not read a fence whose first word is `seal` and whose line is not the opener. `assemble` builds a block's text from pairs and throws where the reader would refuse it.

The module holds four kinds: the verdict kind and the run kind as `pr-check/lib/fields.py` spells them, which scenario 18 compares and #42 reads, and the two below. A rule that spans two keys of a kind is the kind's own check, run after the lines parse, and it refuses the block at its opener.

**The decision kind.**

| Key | Count | Shape of the value |
|---|---|---|
| `decision:` | one | `<id> <kind>`: the id a whole number from 1 with no leading zero, the kind one of `route`, `default`, `scope`, `answered` |
| `decided:` | one | text that opens with a character that is no white space |
| `grounds:` | one | text, as above |
| `by:` | at most one | text, as above |
| `state:` | one | `decided`, `reversed`, `applied <commit>` with 7 to 40 hex digits, or `carried <home>` with a home that opens and ends with a character that is no white space |
| `reversal:` | at most one | text, as above |

The kind's rule: `reversal:` stands where the state is not `decided`, and only there.

**The question kind.**

| Key | Count | Shape of the value |
|---|---|---|
| `question:` | one | `<id>`, as a decision's |
| `asks:` | one | text |
| `grounds:` | one | text: why the code and the policy do not answer it and the session cannot give it itself |
| `by:` | at most one | text |
| `option:` | any number | the label between two backticks, holding no backtick, then optionally a space and what the option implies |
| `default:` | at most one | a label between two backticks |
| `state:` | one | `open` or `answered` |
| `answer:` | at most one | text: an option's label or the person's own words |

The kind's rules: `answer:` stands where the state is `answered`, and only there; no two options hold one label; `default:` names an option's label.

### The record, `apps/desktop/src/daemon/decision-record.ts`

`decisions.md` stands in the work item's directory, beside `routing.md`. A file the module creates opens with the head below, and each block follows a blank line. A line outside every block is prose.

````
# Decisions and questions: <work-item-id>

Each `seal` block below is one decision made for this work item without asking the person, or one question it was parked with. A line outside a block is prose.

```seal
decision: 1 route
decided: The work item runs through the review chain, with no framer.
grounds: `docs/roadmap.md` *Milestones* row 2 puts every pull request of a work item under the check.
by: orchestrator
state: reversed
reversal: Frame it first: the change reaches the protocol.
```

```seal
question: 2
asks: May the run push the branch to `origin`?
grounds: No document of the repository grants it, and a session cannot grant itself a push.
by: sealer
option: `yes` The branch is pushed and the pull request opens.
option: `no` The work item stays on this machine.
default: `yes`
state: open
```
````

- **An id is one over the file.** A new block takes one above the highest id any block of the file holds. The reader refuses, at its opener, a block whose id a block above it holds.
- **The states and who moves them.** A decision is written `decided`. The person's reversal makes it `reversed` and adds `reversal:`. The stage that takes the reversal in before the work item merges makes it `applied <commit>`, naming the commit that took it in, in a commit after that one. After the merge it becomes `carried <home>`, the issue or the work item the reversal went to. A question is written `open`, and the person's answer makes it `answered` and adds `answer:`. No other move is written.
- **One line.** A writer trims a value and writes each run of line breaks inside it as one space. A value that is then empty is refused.
- **A write.** Each function takes the file's text and returns the new text, and one function beside them reads the file, applies a write and puts the whole file back through `whole-file.ts`. A refusal of the reader's on one block does not stop a write to another.

```ts
export type DecisionKind = "route" | "default" | "scope" | "answered";
export type DecisionState = { is: "decided" } | { is: "reversed"; message: string } | { is: "applied"; message: string; commit: string } | { is: "carried"; message: string; home: string };
export interface DecisionBlock { id: number; kind: DecisionKind; decided: string; grounds: string; by: string | null; state: DecisionState; line: number }
export interface QuestionBlock { id: number; asks: string; grounds: string; by: string | null; options: { label: string; implies: string }[]; default: string | null; state: { is: "open" } | { is: "answered"; answer: string }; line: number }
export interface DecisionRecord { decisions: DecisionBlock[]; questions: QuestionBlock[]; refusals: { line: number; why: string }[]; notices: { line: number; why: string }[] }
```

The functions: `workItemDirectory(worktree, branch)`, which gives the directory's path or null; `readDecisionRecord(text)`; `withDecision`, `withQuestion`, `withReversal`, `withAnswer`, `withApplied` and `withCarried`, each from a text to a text; and `writeRecord(directory, change)`, which reads the file and treats only `ENOENT` as no record: a record that stands and cannot be read throws and is left as it is, so a write never replaces a record it could not read. `workItemDirectory` reads `routing.md` as the check does, an unreadable one declaring nothing.

**What the daemon keeps, for #119.** The record holds no clock and nothing of what the person has seen. A block's place in the inbox is read from its state: a decision the person has not seen, an `open` question, and a `reversed` decision. Which ids of a work item the person has seen is the daemon's state, kept in its run folder under the work item's id.

### The policy documents' text

Each entry is written in `docs/architecture.md` and, in the Korean given, in `docs/architecture.ko.md`. No heading is added or removed. P5 removes one table row from each edition, and no entry adds one, so the broad gate's two counts stay equal.

**P1.** *What we take from AgenticSeal* and *AgenticSeal에서 가져오는 것*: a paragraph of its own after the section's first paragraph, before the table.

> **What Owlery took from AgenticSeal is Owlery's own from the day it was taken, and Owlery follows no release of AgenticSeal.** AgenticSeal is where Owlery started. Owlery changes its copies, the role bundle and the PR check's scripts among them, for its own daemon, and no case holds a copy to AgenticSeal's bytes. A later idea of AgenticSeal's comes in as any other idea does, as an issue of Owlery's. Each folder of taken files keeps AgenticSeal's licence text and a notice of where its files started.
> check: apps/desktop/test/role-bundle.test.ts apps/desktop/test/pr-check.test.ts

> **Owlery가 AgenticSeal에서 가져온 것은 가져온 날부터 Owlery의 것이고, Owlery는 AgenticSeal의 릴리스를 따라가지 않습니다.** AgenticSeal은 Owlery가 출발한 자리입니다. Owlery는 역할 묶음과 PR 검사의 스크립트를 비롯한 사본을 자기 데몬에 맞게 고치고, 어떤 테스트도 사본을 AgenticSeal의 바이트에 묶지 않습니다. AgenticSeal에서 뒤에 나온 생각은 다른 생각과 똑같이 Owlery의 이슈로 들어옵니다. 가져온 파일을 둔 폴더마다 AgenticSeal의 라이선스 전문과, 그 파일이 어디서 출발했는지 밝히는 고지를 둡니다.
> check: apps/desktop/test/role-bundle.test.ts apps/desktop/test/pr-check.test.ts

**P2.** The same sections, the second cell of the row that opens "Scripts behind the `seal` commands" and "`seal` 명령의 스크립트".

> The Owlery daemon and the PR check do the same work. The PR check takes AgenticSeal's code, and Owlery adapts it from there: the scripts `chain_check` loads stand in `pr-check/`, started from AgenticSeal 0.38.4, and the workflow of a connected repository fetches them from Owlery's repository. A check rewritten now would have to give a verdict on every record of the chain before the daemon writes one. The daemon runs no Python, since a person's Mac promises none: it reads and writes the records in its own code, and the issue that builds each of the other commands' work decides how

> 같은 일을 Owlery의 데몬과 PR의 검사가 합니다. PR의 검사는 AgenticSeal의 코드를 가져오고, 거기서부터 Owlery가 고칩니다. `chain_check`가 싣는 스크립트는 AgenticSeal 0.38.4에서 출발해 `pr-check/`에 있고, 연결한 저장소의 워크플로가 Owlery의 저장소에서 그것을 받아 옵니다. 지금 다시 짠 검사는 데몬이 기록을 하나도 쓰기 전에 사슬의 모든 기록을 판정해야 합니다. 데몬은 Python을 실행하지 않습니다. 사람의 Mac에 Python이 있다고 기대할 수 없기 때문입니다. 데몬은 자기 코드로 기록을 읽고 쓰며, 나머지 명령이 하던 일은 그 일을 만드는 이슈가 방법을 정합니다

**P3.** *Taking in AgenticSeal's changes* and *AgenticSeal의 변경을 가져오는 법*: the section's whole text under its heading, the three numbered steps among it, becomes one paragraph.

> Owlery takes in no release of AgenticSeal ([What we take from AgenticSeal](#what-we-take-from-agenticseal)). The role bundle is released with the app, so the order the app runs and the bundle do not drift apart. A change to the bundle or to the PR check's scripts is a work item of Owlery's, and the suite runs with it.

> Owlery는 AgenticSeal의 릴리스를 가져오지 않습니다([AgenticSeal에서 가져오는 것](#agenticseal에서-가져오는-것)). Owlery 역할 묶음은 앱과 함께 릴리스되므로, 앱이 실행하는 순서와 묶음이 어긋나지 않습니다. 묶음이나 PR 검사의 스크립트를 고치는 일은 Owlery의 작업이고, 그때 테스트를 함께 돌립니다.

**P4.** *Compatibility with AgenticSeal* and *AgenticSeal과의 호환*: the section's whole text.

> Users of the AgenticSeal plugin keep using it in Claude Code as they do now. The Owlery record format started from the AgenticSeal format and is Owlery's own. Compatibility is kept only where it serves Owlery: the plugin's check and Owlery's both read this repository's own records until Owlery seals its own pull requests ([Milestones](roadmap.md#milestones) row 2). `decisions.md` is a file AgenticSeal does not read, and its check answers the same with the file and without it (probed 2026-11-22 on 0.38.2 and 0.38.4).
> check: apps/desktop/test/pr-check.test.ts

> AgenticSeal 플러그인 사용자는 지금처럼 Claude Code에서 그대로 씁니다. Owlery의 기록 형식은 AgenticSeal의 형식에서 출발했고, Owlery의 것입니다. 호환은 Owlery에 쓸모가 있는 곳에서만 지킵니다. Owlery가 자기 PR에 인장을 찍기 전까지는([마일스톤](roadmap.ko.md#마일스톤) 2행) 이 저장소의 기록을 플러그인의 검사와 Owlery의 검사가 함께 읽습니다. `decisions.md`는 AgenticSeal이 읽지 않는 파일이고, AgenticSeal의 검사는 이 파일이 있을 때와 없을 때 같은 답을 냅니다(2026-11-22 실험, 0.38.2와 0.38.4).
> check: apps/desktop/test/pr-check.test.ts

The crafter writes the Korean link's anchor as `docs/roadmap.ko.md` spells its heading.

**P5.** *Open decisions* and *결정을 남겨 둔 것*: the row that opens "Compatibility with the AgenticSeal record format" and "AgenticSeal 기록 형식과의 호환" is removed. P4 holds the decision.

**P6.** *Records are committed to the repository* and *기록은 저장소에 커밋합니다*: the third bullet becomes the text below, with its check line on the line after it.

> - **When a repository is first connected, the place for records and the PR check are created together, in one commit the person reads first.** The person is not asked where the records go. The app shows each file it would write, the commit's subject and the branch it lands on, and writes nothing until the person confirms. It writes the records' root `seal/`, with a `README.md` and a `config.json`, and the workflow `.github/workflows/owlery-seal.yml`. Where the repository keeps a `seal/` of its own, the root is `agentic-seal/`. A file that is committed is kept as it is, so a repository that holds an AgenticSeal root and AgenticSeal's `hygiene.yml`, told by the check it runs and not by its name, gets no file. The app reads the place from the commit the checkout stands at, as a clone and the check on GitHub get it, and refuses the setup while the checkout does not hold a file of the place as that commit does. The commit holds those files alone, runs the repository's hooks, and is not pushed. The broad gate command is the `Broad gate` key of the root's `config.json`, set in the same step, and the app shows its value and its file on the repository.
> check: apps/desktop/test/records-place.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts

> - **저장소를 처음 연결할 때 기록 자리와 PR의 검사를 함께 만들고, 사람이 먼저 읽은 커밋 하나에 담습니다.** 사람에게 기록 위치를 묻지 않습니다. 앱은 쓰려는 파일 하나하나와 커밋 제목, 커밋이 올라갈 브랜치를 보여 주고, 사람이 확인하기 전에는 아무것도 쓰지 않습니다. 쓰는 것은 기록의 뿌리 `seal/`과 그 안의 `README.md`, `config.json`, 그리고 워크플로 `.github/workflows/owlery-seal.yml`입니다. 저장소가 자기 `seal/`을 따로 쓰고 있으면 뿌리는 `agentic-seal/`입니다. 커밋되어 있는 파일은 그대로 둡니다. 그래서 AgenticSeal의 뿌리와 AgenticSeal의 `hygiene.yml`을 가진 저장소에는 파일을 하나도 쓰지 않고, 그 워크플로는 이름이 아니라 돌리는 검사로 알아봅니다. 앱은 기록 자리를 체크아웃이 서 있는 커밋에서 읽습니다. 클론과 GitHub의 검사가 받는 것이 그 커밋이기 때문입니다. 체크아웃이 기록 자리의 파일을 그 커밋과 같게 갖고 있지 않은 동안에는 기록 자리를 만들지 않습니다. 커밋에는 그 파일만 담고, 저장소의 훅을 그대로 돌리며, 푸시하지 않습니다. 전체 검사 명령은 뿌리의 `config.json`에 있는 `Broad gate` 키이고 같은 단계에서 정하며, 앱은 저장소에 그 값과 그 파일을 보여 줍니다.
> check: apps/desktop/test/records-place.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts

**P7.** The same sections: the paragraph that opens "So repositories that cannot hold work records in the tree" and "그래서 작업 기록을 트리에 둘 수 없는 저장소" gains two sentences at its end.

> The app says so before it writes anything. It refuses the setup where git ignores a file the setup would write, or the root's folder `threads/` or a record below it, where each work item's records go.

> 앱은 무엇을 쓰기 전에 이 점을 먼저 말합니다. 앱이 쓰려는 파일이나, 작업마다 기록이 놓일 뿌리의 `threads/` 폴더와 그 아래 기록을 git이 무시하고 있으면 앱은 기록 자리를 만들지 않습니다.

**P8.** The same sections: a paragraph at the section's end.

> **The PR check runs on GitHub without the app, and judges only a pull request that declares a work item.** The workflow checks out the pull request, fetches `pr-check/` from Owlery's repository at the tag of the release that wrote the workflow, and runs `chain_check.py` against the base branch on Python 3.12 or newer. Until that tag exists it fetches the release's branch. A pull request whose branch no `routing.md` of the records names declares nothing: the check examines nothing and passes it.
> check: apps/desktop/test/pr-check.test.ts apps/desktop/test/records-place.test.ts

> **PR의 검사는 앱 없이 GitHub에서 돌고, 작업을 선언한 PR만 판정합니다.** 워크플로는 PR을 체크아웃하고, 그 워크플로를 쓴 릴리스의 태그에서 Owlery 저장소의 `pr-check/`를 받아, Python 3.12 이상에서 `chain_check.py`를 기준 브랜치에 대해 실행합니다. 그 태그가 생기기 전에는 그 릴리스의 브랜치에서 받습니다. 기록의 어느 `routing.md`도 가리키지 않는 브랜치의 PR은 아무것도 선언하지 않은 것입니다. 검사는 아무것도 살피지 않고 그 PR을 통과시킵니다.
> check: apps/desktop/test/pr-check.test.ts apps/desktop/test/records-place.test.ts

**P9.** The same sections: a paragraph after P8.

> **A work item's records are the one source of the decisions made for it without asking and of the questions that park it.** They stand in `decisions.md` of the work item's directory, each as a `seal` block. A decision holds an id, its kind (a route, a default taken, a scope chosen, or a question the tree answered), what was decided, the grounds, and its state. A question holds an id, what is asked, the grounds, its options, its default, and its state. The daemon reads the file in the work item's worktree, whether or not it is committed, and names a block it cannot read without deciding anything on it. What the person has seen is the daemon's state and stands in no record.
> check: apps/desktop/test/record-blocks.test.ts apps/desktop/test/decision-record.test.ts

> **작업의 기록은 묻지 않고 내린 결정과 그 작업을 멈춰 둔 질문이 있는 단 하나의 자리입니다.** 둘 다 작업 폴더의 `decisions.md`에 `seal` 블록으로 하나씩 둡니다. 결정에는 번호, 종류(경로, 기본값을 택함, 범위를 정함, 트리가 답한 질문), 정한 내용, 근거, 상태가 있습니다. 질문에는 번호, 묻는 내용, 근거, 선택지, 기본값, 상태가 있습니다. 데몬은 작업의 워크트리에서 이 파일을 커밋 여부와 상관없이 읽고, 읽지 못한 블록은 읽지 못했다고 밝힐 뿐 그것으로 아무것도 정하지 않습니다. 사람이 무엇을 보았는지는 데몬의 상태이고, 어떤 기록에도 두지 않습니다.
> check: apps/desktop/test/record-blocks.test.ts apps/desktop/test/decision-record.test.ts

**P10.** The same sections: a paragraph after P9.

> **A decision is `decided`, `reversed`, `applied` or `carried`, and a question is `open` or `answered`.** A person reverses a decision with a message, and the record keeps the message. The stage that takes the reversal in before the work item merges writes `applied` with its commit. A reversal that comes after the merge is written `carried`, with the issue or the work item it went to. A `reversed` decision and an `open` question are open rows of the record: a settle keeps the work item's directory while `git grep -n -E '^state: (reversed|open)[[:space:]]*$' -- '*/threads/*/decisions.md'` prints a line of it. A release's pull request lists the decisions made without asking in that release, read from the same blocks.
> check: apps/desktop/test/decision-record.test.ts

> **결정의 상태는 `decided`, `reversed`, `applied`, `carried` 가운데 하나이고, 질문의 상태는 `open`이나 `answered`입니다.** 사람은 메시지를 붙여 결정을 뒤집고, 기록은 그 메시지를 지닙니다. 작업이 머지되기 전에 뒤집힌 결정을 받아들인 단계는 그 커밋과 함께 `applied`라고 씁니다. 머지된 뒤에 뒤집힌 결정은 그것을 넘겨받은 이슈나 작업과 함께 `carried`라고 씁니다. `reversed`인 결정과 `open`인 질문은 기록의 열린 줄입니다. settle은 `git grep -n -E '^state: (reversed|open)[[:space:]]*$' -- '*/threads/*/decisions.md'`가 그 작업 폴더의 줄을 찍는 동안 폴더를 남겨 둡니다. 릴리스의 PR은 그 릴리스에서 묻지 않고 내린 결정을 같은 블록에서 읽어 나열합니다.
> check: apps/desktop/test/decision-record.test.ts

**P11.** *State lives in three places* and *상태는 세 곳에 둡니다*: the second cell of the row "The user's repository", then the second cell of the row "The daemon", each in English and then in Korean.

> All work records, including seal records and their grounds (design, round records, broad gate results), and the decisions made without asking and the questions that park a work item

> 인장 기록과 그 근거(설계, 회차 기록, 전체 검사 결과), 묻지 않고 내린 결정과 작업을 멈춰 둔 질문을 포함한 작업 기록 전체

> Progress, session events and output, each pane's record with the id of its conversation, the cost ledger, what the person has seen, schedule

> 진행 상태, 세션 이벤트와 출력, 칸마다 그 대화의 ID를 담은 기록, 비용 장부, 사람이 무엇을 보았는지, 일정

**P12.** *What changes because Owlery is not a plugin* and *플러그인이 아니라서 달라지는 것*, the row "Moving records to another machine": the words in the brackets "(progress, the cost ledger, questions and answers)" become "(progress, the cost ledger, what the person has seen)", and in the Korean edition the words "질문과 답" of that row become "사람이 무엇을 보았는지".

What the build added or narrowed beside the text above, folded by the orchestrator on 2026-11-22 from phase 2:

- `RecordsPlan` carries `proposedBroadGate: string | null`: the daemon proposes the `Broad gate` command from `package.json`'s `check` script (else `test`) with the package manager the lockfile names, and fills it only into a field the person left empty. It is not part of the stamp. It was built under the owner's word of 2026-11-22 to think past the request with what the daemon can do.
- Where both root names are taken, the plan is `blocked` and lists the workflow line alone, so `files` is in the order README, config, workflow only where the plan writes a root.
- A plan with nothing to write is `blocked` where both root names are taken in the commit, where git ignores a record path, where the root's `threads` is not a folder, or where the checkout differs from the commit (*Scope* 10). Where none of those holds and git cannot say whether it ignores a record path, behind a link at the sample's `threads/0-work-item` for one, no plan is made: the daemon answers with git's words, and the dialog shows them in place of what the repository has (`gaps.md` *Not done*). Otherwise a repository that has every part committed shows what it has, on a detached head too (*Scope* 12 reads with this).
- The dialog opens right after registration only where the `inbox` that follows within a second holds the added repository or one at exactly the typed folder; otherwise the person opens it from the repository's menu.
- `records-place.ts` runs git with its own helper, since it needs `check-ignore`'s exit code and a hook's output.

From phase 3, folded the same day:

- A block's id is read up to 15 digits, the integers JavaScript holds exactly.
- `writeRecord` returns the `DecisionRecord` it wrote, and the module exports `RECORD_FILE`. A refusal of `read` carries `block`, the opening line of the refused block, or null outside one. A new block's id is greater than any id a refused block's first line names.
- `assemble` refuses a value holding a line break; `withDecision` and `withQuestion` throw where the new block would not read back; `withApplied` and `withCarried` apply to a `reversed` decision only.
- `pr-check/lib/fields.py`'s docstring still calls itself the one statement of the grammar; the TS reader now states it too, and the docstring is left as taken (*Scope* 1), named in `gaps.md`.
- The running daemon does not read `decisions.md` until #119 connects it.

## Rule changes

- nothing
  why: This work item writes its rules into the policy root in its own pull request (*Scope* items 3, 4, 18 and 19). The issue's sixth *Done when* line names `docs/architecture.md` as what the work writes, the owner's decisions of 2026-11-22 are on that document's text, and #119, which merges next, edits the same sections in its own pull request and has to read them as merged. It moves no document and no section. It takes one rule change of an unsettled design out: the two `add` operations of `seal/threads/1795329620-role-bundle/frame/design.md` whose section is *Taking in AgenticSeal's changes*, which P1 and P3 replace (*Scope* item 6).

## Removes

The work adds a workflow, a folder of scripts, two client messages, a record file and two kinds of block. In return it takes out the mechanism that held Owlery's copies to AgenticSeal: the rule on taking in each release, the case that pins the bundle's files, and the open decision on compatibility. The daemon's stores of decisions and of questions, which #119 built and has not merged, give way to the record, and #119's reframe takes them out (`frame/plan.md` *Overlap with the release*).

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The words "Whether to take the code and adapt it or to rewrite it is not decided", and the same in Korean | `docs/architecture.md` *What we take from AgenticSeal* and `docs/architecture.ko.md` *AgenticSeal에서 가져오는 것* | P2 states the choice |
| The three steps of taking in a release, and the sentence before them | `docs/architecture.md` *Taking in AgenticSeal's changes* and `docs/architecture.ko.md` *AgenticSeal의 변경을 가져오는 법* | P3. The owner decided on 2026-11-22 that Owlery follows no release |
| The row "Compatibility with the AgenticSeal record format" and the sentence "Whether to keep this compatibility is not decided", with the same in Korean | `docs/architecture.md` *Open decisions* and *Compatibility with AgenticSeal*, and the same sections of `docs/architecture.ko.md` | P4 holds the decision |
| The two `add` operations on *Taking in AgenticSeal's changes* | `seal/threads/1795329620-role-bundle/frame/design.md` *Rule changes* | Superseded by P1 and P3, so the settle writes neither |
| The case that pins the list of the bundle's files, with its count of the documents taken | `apps/desktop/test/role-bundle.test.ts`, the case "holds the 15 documents taken from AgenticSeal, its licence, the notice and the manifest, and no other file" | Removed; the bundle's other cases read the manifest, the licence and the notice (phase 1). The old case has no catch on record: #38 added it, and no change of the bundle came after |
| The table of the files taken, the section *What Owlery changed* with its claim "byte for byte", and the section *Taking in a later release of AgenticSeal* | `apps/desktop/role-bundle/README.md` | The notice of origin stays. What Owlery changed is in git |
| The sentence "Whether Owlery takes AgenticSeal's scripts or rewrites them is decided by issue #40." | `apps/desktop/role-bundle/README.md` *What the bundle leaves out* | Rewritten: the check's scripts stand in `pr-check/` |
| The cell "Progress, session events and output, the cost ledger, questions and answers, schedule", the words "questions and answers" of the row on moving records, and the same in Korean | `docs/architecture.md` *State lives in three places* and *What changes because Owlery is not a plugin*, and the same sections of `docs/architecture.ko.md` | P11 and P12 |

Framed 2026-11-22 by framer, before the build.
