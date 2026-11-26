# Review round 3: 1795696248-132-a-connected-repositorys-pin-follows-the-app

```seal
target: 8b7c0b1e, fixes 62b2880e..8b7c0b1e
```

This is a verifying round of round 2. It read the diff `62b2880e..8b7c0b1e`: the round 2 record `a22f3619`, the framer's fold `666fd599`, the fix `34829cb3` and the close record `8b7c0b1e`. It read whole at `8b7c0b1e` `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-1.md`, `trail/phases/phase-2.md`, `trail/rounds/round-1.md` and `trail/rounds/round-2.md`. No `pr.md` and no `pr.<lang>.md` stand at the target. The base `origin/release/v0.0.5` still names `f683c693`.

No test, probe or mutation ran in this round, because a broad gate runs alone on this Mac and the spawn prompt barred every test run. Each claim below that something passes or went red is read from the crafter's recorded runs in its scratch directory `fix-2/` (`red-1.txt`, `red-2.txt`, `red-3.txt`, `green.txt`, `daemon.txt`, `built.txt`, `m-daemon.txt`, `m-place.txt`, `m-view.txt`, and `tsc.txt`, which is empty), and it is labelled `read`.

Carried from rounds 1 and 2 as coordinates and not searched again: `seal-state.ts#refusedAt`, `decision-record.ts#workItemDirectory`, `repository-file.ts#repositoryFileText`, `Daemon#readBranch` reading the head from the repository (`daemon.ts:4584`), and `whyNoRun`'s sentence for a folder that is gone.

The two new cases were read against their groups. The case on a gone folder (`daemon.test.ts:2127`) holds the `existsSync` branch of `unreadRecords`, and the case on a broken `.git` link (`:2108`) still holds the `catch` branch, so neither repeats the other. The case on a named pipe (`records-place.test.ts:1034`) holds the read before the plan, which the case on an edit saved during the plan (`:1011`) does not reach. One gap that is not a finding stands in `view.test.ts:5214-5216`. The added expectation on a work item not read builds a plan whose one entry has another sentence, and `recordsDialog` maps every entry the same way. So it pins nothing that the expectation at `:5213` does not, and its comment claims a fact of the daemon that no case of the window can hold.

## Findings

### 1. The rule texts the settle writes into `docs/architecture.md` still say the dialog names every work item whose records the app could not read

```seal
severity: should
location: `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/design.md:109`, `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/design.md:114`
evidence: read `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/design.md:38`, `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/design.md:109`, `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/design.md:114`, `apps/desktop/src/daemon/daemon.ts:2884-2894`; executed `git grep -n -F "holds no directory for its branch"`, `git grep -n -F "without its records' folder"`
```

Why it matters: the settle writes the `to` of each `## Rule changes` operation into the policy documents and then removes this work item's directory, `gaps.md` and `changelog.md` with it. The `add` at `frame/design.md:109` says "the dialog names … each whose records the app could not read there, its worktree's folder gone among them, with the sentence that says why". The Korean `add` at `:114` says the same ("작업 트리 폴더가 없어진 작업을 포함해 앱이 그 기록을 읽지 못한 작업도"). Round 2's finding 2 left one instance of the class that the code does not reach, and the fix pass stated it as a limit. A work item whose worktree stands without its records' directory, while its branch's head holds that directory, is read as one with no records and is not named.

The two searches printed that limit at `frame/design.md:38` (*Scope* item 6), `daemon.ts:2893` (the docstring of `unreadRecords`), `changelog.md:8` and `gaps.md:16`, and in round 2's record. The rule texts at `:109` and `:114` were edited by the fold `666fd599` and do not state the limit. After the settle, the policy states without the limit that every work item the app could not read is named, and only a docstring says otherwise. This is a sample: a statement of the limit in other words escapes the searches. Round 2's own finding listed the statements of "git's sentence" for the fix pass and did not list these two texts for the limit, so the gap was left by round 2's fix as much as by the fix pass.

In `frame/design.md:109`, after "with the sentence that its records were not read yet.", add:

```markdown
A work item whose worktree stands without its records' folder, while its branch's head holds them, is read as one with no records, and the dialog does not name it.
```

In `frame/design.md:114`, after "그 기록을 아직 읽지 않았다는 문장과 함께 알립니다.", add:

```markdown
작업 트리는 있는데 기록 폴더가 없고 브랜치 끝에는 기록이 있는 작업은 기록이 없는 작업으로 읽혀, 대화 상자가 알리지 않습니다.
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: where any entry is named, `view.ts:2696` shows the head "Work items whose records Owlery's readers refuse or did not read" and the sentence `readBut` (`:2687`), which leaves out "those named here as not read". Where none is named, `read` (`:2685`) and "They refuse no work item's records" stand, and the daemon now names every work item it did not read, except the limit that finding 1 of this round is about. Both rows at `docs/design.md:443` and `docs/design.ko.md:443` name the new caption and "its entry's sentence" (`그 작업의 문장을`). The docstrings of `RecordsWords.unread` and `recordsDialog`, `renderer.ts#showRecords` and the CSS comment at `index.html:585` say the same. `git grep -n -F "Work items whose records Owlery's readers refuse"` prints those places, `changelog.md:8` and the round records (executed). The crafter's `red-1.txt` shows the case at `view.test.ts:5207` failing on the old head and the old sentence, and `m-view.txt` shows two mutants red. Both are read.

```seal
confirms: round-2#2
```
What holds: `daemon.ts:2902-2903` names a work item whose worktree's folder is gone with "Owlery could not read these records, … the folder of work item <id> is gone: <folder>", after the head is found and before `refusedAt`. `existsSync` is imported at `daemon.ts:2`. The case at `daemon.test.ts:2127` removes the folder after the daemon read the head and expects the entry. The crafter's `red-2.txt` shows it failing against the old code with `unread` `[]`, `m-daemon.txt` shows the mutant that drops the check red, and `daemon.txt` shows the group at 10 cases passing. All three are read. `frame/design.md:38` and `:64` now match the code. *Scope* item 6 drops "whose worktree holds its directory" and states the limit. Scenario G builds the gone folder, the broken link and the head not read as three work items. `git grep -n -F "git's sentence"` over the work item, `apps` and `docs` prints only round 2's record (executed). `frame/design.md:85` and `protocol.ts:112` name "the sentence that says why". The limit's statement in the rule texts is finding 1.

```seal
confirms: round-2#3
```
What holds: `records-place.ts:571-577` reads the workflow through `repositoryFileText`. That reader opens with `O_NONBLOCK`, refuses a link, refuses what is not a plain file, and refuses a file over `REPOSITORY_FILE_BYTES`, and anything it refuses gives null, which refuses a move. `:596` compares `bytes.toString("utf8")` with that text, and the comment at `:595` states the UTF-8 precondition. `repositoryFileText` decodes with `readFileSync(fd, "utf8")`, the same decoder. A workflow over the bound is never offered a move, because the plan reads it through `textOf` and `pinnedVersion` finds no version. So the new null does not refuse a move the plan offered. The case at `records-place.test.ts:1034` places a named pipe at the path after the plan, with a 2-second limit and a `perl` writer that opens the pipe after 3 seconds. Against the old code, `readFileSync` holds the event loop until the writer opens. The case's timer then fires late, which matches the crafter's `red-3.txt`, "Test timed out in 2000ms" after 3390ms. `green.txt` shows `records-place.test.ts` and `view.test.ts` at 635 cases passing, and `m-place.txt` shows two mutants red. All three are read. The writer is killed through its `ChildProcess` in the case's cleanup. `gaps.md:15` says the text is read through `repositoryFileText` and compared as UTF-8.

What matched: `changelog.md:8` drops "never", names the caption, and states the limit. `gaps.md:16`, a new row of *Not done*, states the limit with its grounds, which are that reading the directory from the head commit would change how the seal finds it. Both agree with `daemon.ts:2884-2894` and *Scope* item 6. Read.

What matched: record against another work item's frame. The fix changed no section of `docs/` that another work item's `## Rule changes` names. Its one edit to a policy document is this work item's own row at line 443 of both editions, and it adds no row. Read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the typecheck and the documents' check at `8b7c0b1e`. This round ran nothing, and the crafter's recorded runs are of single files and groups, so the suite is `unverified`. `tsc.txt` is empty and names no exit code | `gaps.md:7`, `gaps.md:9` | the orchestrator, at the broad gate |
| Which file `built.txt` (1 file, 2 tests) ran. Its output names none, so whether it was `records-dialog.test.ts` in the built app is not read | `apps/desktop/test/records-dialog.test.ts` | the orchestrator's built-app batch |
| Whether `/usr/bin/perl` stands on every machine that runs `records-place.test.ts`, such as the CI runner. Where it does not, `spawn` fails and the case's pipe has no writer, so a read that waits would hang to the suite's limit | `apps/desktop/test/records-place.test.ts:1041` | the orchestrator, at the broad gate and in CI |
| The caption's drawing over a named entry in the built app, which no shot holds | `apps/desktop/src/renderer/index.html:1131`, `gaps.md:10` | read only; no scene of the screenshot run names an entry (`gaps.md:18`) |
| Whether an open pull request's next run takes the moved pin once the base holds it (Q3) | `frame/questions.md:16` | a measurement on GitHub |

## Probes

No probe ran in this round. A broad gate runs alone on this Mac, and the spawn prompt barred every test run. The confirmations rest on reading and on the crafter's recorded runs.
