# Review round 1: 1795497941-night-watch-marks-as-moons

```seal
target: 6f7aa9f against release/v0.0.3
```

The range is `c82c611..6f7aa9f`, nine commits. No earlier round exists, so no fact is carried from one: every coordinate below was opened in this round. `seal/parity.json` is not declared. The records were read whole at `6f7aa9f`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` and `trail/phases/phase-2.md`. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed.

## Findings

### 1. The design document says a moon's filled part is its lit part, and the light appearance draws it as the dark part

```seal
severity: should
location: `docs/design.md:51`, `docs/design.ko.md:51`, `seal/threads/1795497941-night-watch-marks-as-moons/changelog.md:5`
evidence: read `docs/design.md:51`, `docs/design.ko.md:51`, `apps/desktop/src/renderer/themes.css:207-209`, `apps/desktop/src/renderer/index.html:126`, `seal/threads/1795497941-night-watch-marks-as-moons/screenshots/night-watch-light-inbox.png`, `seal/threads/1795497941-night-watch-marks-as-moons/trail/phases/phase-2.md:19`
```

Why it matters: Night watch's cell of the row "A state's marks" says "The lit part of a moon is filled" and "A dark disc with a thin lit edge is asleep", and the Korean cell says the same. The cell covers both appearances, and where the light appearance draws a mark differently it says so, as it does for the triangle. The page fills the `fill` part in the state's colour (`apps/desktop/src/renderer/index.html:126`). In the light appearance that colour is darker than the ground: `--state-working` is `#26262a` and `--state-finished` and `--state-no-agent` are `#62605c` (`apps/desktop/src/renderer/themes.css:207-209`). So in the light screenshots the asleep mark is a light disc with a dark edge, the half moon's filled half is its dark half, and the finished mark is a dark disc (`screenshots/night-watch-light-inbox.png`, read enlarged). Two sentences of the cell are false of the light appearance. `docs/design.md` *A pull request that changes the window carries its screenshots* says a review reads each screenshot against this document, so the next review of a window change reads a light screenshot against a sentence it contradicts. The changelog bullet repeats the claim for the release notes: "is a dark disc with a thin lit edge at its right".

Phase 2 read the fact (`trail/phases/phase-2.md:19`, "In the light appearance the filled half looks like the dark half"). Its closing paragraph claimed that no statement of the records read whole is contradicted by HEAD (`trail/phases/phase-2.md:25`), and it read `changelog.md`. The claim missed `changelog.md:5`, which the phase's own paragraph contradicts.

The fix words the cell by what is filled, which holds in both appearances, and says what the light appearance draws. The order of fullness is unchanged, so the case at `apps/desktop/test/theme-controls.test.ts:290-300` still holds it. In `docs/design.md:51`, Night watch's cell:

```markdown
The phases of the moon, and the owl's eye. A moon is a disc filled as far as work has come, so how far work has come reads as how full the moon is. A ring with a thin filled edge at its right is asleep. A half-filled disc is at work, and it does not turn. A wholly filled disc is finished. The fill is the state's ink, so in the light appearance the filled part is the darker one, and a finished work item is a dark disc. An open eye with its pupil needs the person. A filled triangle is a failure, and in the light appearance a line of the darkened yellow stands around it, because the bright fill alone does not stand apart from the ground.
```

In `docs/design.ko.md:51`, Night watch's cell:

```markdown
달의 위상과 올빼미의 눈입니다. 달은 일이 나아간 만큼 채워지는 원판이므로, 일이 얼마나 나아갔는지가 달이 얼마나 찼는지로 읽힙니다. 오른쪽 가장자리만 가늘게 채운 고리는 잠든 것입니다. 반을 채운 원판은 일하는 중이고, 돌지 않습니다. 다 채운 원판은 끝났다는 뜻입니다. 채우는 색은 상태의 잉크이므로, 밝은 모양에서는 채운 쪽이 더 어둡고, 끝난 작업은 어두운 원판입니다. 눈동자가 있는 뜬 눈은 사람이 필요하다는 뜻입니다. 채운 세모는 실패입니다. 밝은 모양에서는 세모 둘레에 어둡게 한 노란색의 선이 있습니다. 밝은 노란색으로 채우기만 하면 바탕에서 도드라지지 않기 때문입니다.
```

In `changelog.md:5`, the bullet:

```markdown
- **Night watch draws how far work has come as how full the moon is.** A work item asleep, which is also a place of the approval line not started, is a ring with a thin filled edge at its right. A work item at work is a half-filled disc. A finished work item is a wholly filled disc. The fill is the state's ink, so in the light appearance the filled part is the darker one. The inbox, the sidebar, the summary and the approval line draw the new marks. No colour changes.
```

The snippets leave other statements of the same fact, and the fix pass owes a judgment on each. The method was `git grep -n -I -e 'lit edge' -e 'dark disc' -e 'lit part' -e 'lit at its right' -e 'is lit' -e '빛나' -e '어두운 원판' -e 'dark half' -e 'filled half'` over the tree, which is a sample, since it finds only these spellings. It printed `frame/design.md:45`, `60`, `110` and `111`, `frame/plan.md:17`, `frame/questions.md:15` and `16`, `pr.md:4`, which quotes `frame/design.md:60`, and the comment at `apps/desktop/test/theme-controls.test.ts:290`, "the lit part, which is the filled one". The frame lines state what the framer decided at `523a5fb`. Where the fix pass leaves them, it says so in its phase record. If it changes `frame/design.md:60`, the quote at `pr.md:4` has to change with it.

```seal
verdict: fixed ad38439
answer: The cell of both editions and the changelog bullet take the paste-ready texts, with one change of words: "the state's ink" became "the state's colour" (Korean "상태의 색"), the term `docs/design.md:70` and `450` and their Korean lines use for what a mark is filled with. The changelog's next bullet said "the half moon" for the working mark and now says "the half-filled disc". The comments at `apps/desktop/test/theme-controls.test.ts:290` and `295` name the filled part and say it is dark or light as the appearance gives the state's colour; the assertions and the variable names are unchanged. In `d7abdc9` the phase 2 record and the second cell of the closed row at `gaps.md:9` say "filled edge" where they said "lit edge" and "lit part", and the phase record's closing paragraph says its reading missed `changelog.md:5`. The frame lines the search printed, `frame/design.md:45`, `60`, `110` and `111`, `frame/plan.md:17`, and `frame/questions.md:15` and `16`, are not the fix pass's to write; they are handed to the orchestrator to fold, and `frame/design.md:110` and `111`, which give the cells' text, now differ from both editions. `pr.md:4` is left to the orchestrator, who repairs its quotes after this pass. Run after the commit: `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/theme-controls.test.ts test/themes.test.ts`, 2 files and 22 cases passed, and both editions hold 15 lines that begin with `#` and 379 that begin with `|` (executed).
location: `docs/design.md:51`, `docs/design.ko.md:51`, `seal/threads/1795497941-night-watch-marks-as-moons/changelog.md:5-6`, `apps/desktop/test/theme-controls.test.ts:290-295`
```

### 2. The light appearance's reversed moons are handed to the owner, and nothing the owner reads on the pull request carries them

```seal
severity: should
location: `seal/threads/1795497941-night-watch-marks-as-moons/gaps.md:10`, `seal/threads/1795497941-night-watch-marks-as-moons/pr.md:12`, `seal/threads/1795497941-night-watch-marks-as-moons/trail/phases/phase-2.md:19`
evidence: read `seal/threads/1795497941-night-watch-marks-as-moons/trail/phases/phase-2.md:19`, `seal/threads/1795497941-night-watch-marks-as-moons/gaps.md:5-12`, `seal/threads/1795497941-night-watch-marks-as-moons/pr.md:1-12`, `seal/threads/1795497941-night-watch-marks-as-moons/frame/questions.md:18`
```

Why it matters: phase 2 says the light appearance's reversal "changes nothing built and is for the owner's judgment of Q1 to Q4 on the pull request" (`trail/phases/phase-2.md:19`). No row of `gaps.md` *Not verified* names it, and `pr.md` quotes only the text of each question Q1 to Q5 (`pr.md:7-11`). The option text of Q4 (a) states the dark full disc (`frame/questions.md:18`), and `pr.md` does not quote it. It says nothing of the half moon and the asleep mark. So the owner, who judges the forms from the pull request's body, is not told the light appearance draws the moons reversed.

This round's reading of scenario 8, which `gaps.md:10` gives to the proofer, does not settle the light appearance. The five marks read apart in both appearances, and a finished place reads as done in the dark one (*Confirmations*). In the light one the finished mark is the most filled of the three, so along an approval line it reads as furthest. Read alone as a moon, a dark disc on a light ground reads as a new moon, which is the state with nothing lit. Whether a person reads it as done is the owner's judgment. No case can hold that reading.

The fix adds one row to `gaps.md` *Not verified*, after the row at line 10:

```markdown
| Phase 2: in the light appearance the filled part of each moon is drawn in the state's dark ink on the light ground, so read as moons the marks are reversed: the half moon's filled half is its dark half, and a finished work item is a dark disc, which reads as a new moon when seen alone (`trail/phases/phase-2.md`, the paragraph on the light appearance; `trail/rounds/round-1.md`, finding 2) | the owner, on the pull request |
```

It also adds one line to `pr.md`, after line 12. "the sixth row" assumes the row above stands sixth, after the five rows at `gaps.md:7-11` and before the row at line 12. If the fix pass places the row elsewhere, it changes the ordinal.

```markdown
- "Phase 2: in the light appearance the filled part of each moon is drawn in the state's dark ink on the light ground, so read as moons the marks are reversed: the half moon's filled half is its dark half, and a finished work item is a dark disc, which reads as a new moon when seen alone" (`gaps.md` *Not verified*, the sixth row)
```

```seal
verdict: fixed d7abdc9
answer: `gaps.md` *Not verified* holds the row as its sixth row, at line 12, after the row on a screen of density 1 and before the row on the broad gate, so the ordinal of the `pr.md` line stands. Its words follow finding 1's term: "drawn in the state's colour, which is darker than the light ground" in place of "drawn in the state's dark ink on the light ground"; the rest is the paste-ready text. The phase 2 record's paragraph on the light appearance now names that row. The `pr.md` line is not added by this pass: the orchestrator repairs `pr.md` after it, and the line's quote has to take the row's words as committed.
location: `seal/threads/1795497941-night-watch-marks-as-moons/gaps.md:12`, `seal/threads/1795497941-night-watch-marks-as-moons/trail/phases/phase-2.md:19`
```

### 3. A phase record holds the worktree's real absolute path

```seal
severity: should
location: `seal/threads/1795497941-night-watch-marks-as-moons/trail/phases/phase-2.md:10`
evidence: executed `git grep -n -I -F -e '/Users/' -- seal` in the worktree, which printed `seal/threads/1795497941-night-watch-marks-as-moons/trail/phases/phase-2.md:10` alone
```

Why it matters: the command quoted at `trail/phases/phase-2.md:10` sets `OWLERY_SCREENSHOT_DIR` to the worktree's real absolute path, which names the user's home directory and the worktree's folder. The run's rules say no record holds the worktree's absolute path. The plan writes the same command with a placeholder, `<the repository's absolute path>` (`frame/plan.md:40`). The record merges by squash into `release/v0.0.3`, so the settle's removal of the directory does not take the path out of history. The search above lists every tracked line under the records root that holds a home directory's path, so at `6f7aa9f` this line is the whole class there. Outside `seal/` the same search over the tree finds only placeholder paths such as `/Users/x`.

The fix replaces line 10 of the fenced command with:

```text
OWLERY_BACKGROUND=1 OWLERY_SCREENSHOTS=1 OWLERY_SCREENSHOT_DIR=<the repository's absolute path>/seal/threads/1795497941-night-watch-marks-as-moons/screenshots node scripts/test-in-electron.mjs test/screenshots.test.ts test/records-dialog.test.ts test/korean-input.test.ts
```

```seal
verdict: fixed d7abdc9
answer: Line 10 of the phase 2 record takes the plan's placeholder, as the paste-ready text gives it. After the commit `git grep -n -I -F -e '/Users/' -- seal` prints only this record's own quotes of that search, and `git grep -n -I -F -e 'owlery-183' -e '/private/tmp' -e 'Documents/GitHub' -- .` over the tree prints nothing and exits 1 (both executed), so no record holds the worktree's path or a scratch path.
```

## Confirmations

What matched: the eight values of `frame/design.md` *Data & interfaces* stand in both Night watch blocks, at `apps/desktop/src/renderer/themes.css:140-147` and `255-262`, and in both cells of the token rows at `docs/design.md:223-230` and `docs/design.ko.md:223-230`. `--shape-waiting`, `--shape-waiting-fill`, `--shape-failed`, `--shape-failed-fill` and every `--state-*` value are unchanged, and Register's and Desk's blocks are not in the diff (read, `git diff c82c611...6f7aa9f`).

What matched: the two cells of the row "A state's marks" are the texts of `frame/design.md:110` and `111` word for word (executed, `grep -cF` of each text against both editions, one match each in its own edition). The phrases of *Principles* 1 and "the eye mark" at `docs/design.md:497` are those of *Scope* item 4 and *Data & interfaces* (read). Finding 1 asks to change the cells' text. The frame's wording was built as written.

What matched: scenario 6's search at HEAD printed nothing and exited 1. Scenario 7: both editions hold 15 lines that begin with `#` and 379 that begin with `|`. Scenario 9: `apps/desktop/package.json:3` names `0.0.3` (all executed).

What matched: the page draws every new form with its four parts and no change of its own (`apps/desktop/src/renderer/index.html:117-128`, read). The `turn` part keeps its animation where its shape is `none` and draws nothing (`apps/desktop/src/renderer/index.html:128`, read).

What matched: the assertions at `apps/desktop/test/theme-controls.test.ts:292-300` are the lines phase 1's table of mutants names (`trail/phases/phase-1.md:17-27`), each at the guard it says. They sit in the standing case and add no case, so no new test is read against its group. Each holds a fact of *Scope* item 5 or of the row "A state's marks". Line 300, the departure phase 1 names (`trail/phases/phase-1.md:9`), holds "it does not turn" of `docs/design.md:51` (read). The run and the seen-red claims are phase 1's, labelled executed there, and this round did not run the file again (*Not judged*).

What matched: phase 1's answer to Q6 (`trail/phases/phase-1.md:7`) is the answer recorded in the status of `frame/questions.md:20` (read). The case measures the filled width across the middle row with `isPointInFill` and keeps the box for the finished part (`apps/desktop/test/theme-controls.test.ts:254-262`, read).

What matched: each quote of `pr.md:3-12` stands word for word at the coordinate it names: `frame/design.md:60` and `70-71`, `frame/questions.md:15-19`, and the first sentence of the fifth row at `gaps.md:11` (read). The screenshot links name `1bbe951`, which commits the sixteen files (read).

What matched: the reading `gaps.md:10` gives to the proofer, against the row "A state's marks". In both appearances, in the inbox, the sidebar and the approval line of `night-watch-dark-inbox.png`, `night-watch-light-inbox.png`, `night-watch-dark-view.png` and `night-watch-light-view.png`, each of the five marks is told from the other four by shape. The wait is the eye with its pupil, at work is a half-filled disc, finished is a whole disc, asleep is a ring heavier at its right, and the failure is the triangle. In the dark appearance a finished place reads as done, as a full light disc. In the light appearance it reads as the fullest mark, and finding 2 gives the moon reading to the owner (read, the files enlarged; *Probes*). This round does not mark the row closed, since the record is the round's only write.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The built-app case files, run at `6f7aa9f`: `test/theme-controls.test.ts`, `test/themes.test.ts` and those `gaps.md:8` names. This round read the assertions and ran no file, since other builds share the machine and reading settled each question it asked | `apps/desktop/test/` | the orchestrator, at the broad gate |
| The broad gate over the range | `seal/config.json`, the key `Broad gate` | the orchestrator |
| How a screen of density 1 draws the asleep mark's inner curve. The committed screenshots are drawn at density 2 and scaled down | `seal/threads/1795497941-night-watch-marks-as-moons/gaps.md:11` | the owner, on the pull request |
| Whether a person reads a finished place in the light appearance as done | `seal/threads/1795497941-night-watch-marks-as-moons/gaps.md:10`; finding 2 | the owner, on the pull request |

## Probes

| Command | Result |
|---|---|
| `magick <screenshot> -crop 400x280+260+280 -filter point -resize 400%` and `-crop 740x40+680+320 -filter point -resize 300%`, over `night-watch-dark-inbox.png` and `night-watch-light-inbox.png`, writing into the round's scratch directory | Four enlarged images of the inbox's lines and of the approval line, read for *Confirmations* and finding 1. No code ran |
| `git grep -n -e 'closed eye' -e '감은 눈' -e 'M2.6 7.2a5.6' -e 'eye marks' -e 'eye of a state' -e '상태 표시의 눈' HEAD -- . ':!seal/threads/1795497941-night-watch-marks-as-moons'` | Nothing printed, exit 1 |
| `git grep -n -I -F -e '/Users/' -- seal` | One line, `trail/phases/phase-2.md:10` |
