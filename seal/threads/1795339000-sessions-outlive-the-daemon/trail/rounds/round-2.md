# Review round 2: 1795339000-sessions-outlive-the-daemon

```seal
target: 2e11f24, fixes 85342ec..2e11f24
```

This is a verifying round. It answers the six findings round 1 closed `fixed a49e3b3`, and it reviews the fix diff `85342ec..2e11f24` as new text. It read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-3.md`, `trail/phases/fix-1.md` and `trail/rounds/round-1.md` whole at `2e11f24`. It also read the diff of `docs/architecture.md` and `docs/architecture.ko.md` from the merge base `a3e4e7a` once more. The work item has no `pr.<lang>.md`, which is right, because `Commit and pull request language` is English in `seal/config.json`. No `seal/parity.json` is declared.

Facts carried from round 1 and not established again: the four phase-3 edits sat at their anchors at `e7a6ca3`; issue #133 is open in `release: 0.0.3`, and the comments on #61, #55 and #78 match `frame/plan.md` items 2 to 4 (round 1 ran `gh issue view`, and this round ran nothing against GitHub); `docs/architecture.md:86` and `:244` stand without change once finding 5's sentence names the condition. The *Overall layout* bullet at `docs/architecture.md:39` ("on the person's confirmation") belongs to #133's frame, as round 1 assigned it, and is not raised here.

The fix pass closes five of the six findings as round 1 asked. It leaves two defects in the text it changed and one in how it recorded that change. The `took a resize` defect and the role-session defect came from round 1's own snippets, applied as written. The class of finding 1 has a second instance, the role session at a crash, which round 1's snippet did not reach. `fix-1.md` is a correction written beside the plan's blocks, not in them.

## Findings

### 1. The table still says a role session ends when the daemon crashes, which nothing ran, and the hangup condition the fix wrote cannot reach a role session

```seal
severity: should
location: `docs/architecture.md:44`, `docs/architecture.md:51`, `docs/architecture.ko.md:44`, `docs/architecture.ko.md:51`, `seal/threads/1795339000-sessions-outlive-the-daemon/gaps.md:10`
evidence: read `docs/architecture.md:44`, `docs/architecture.md:51`, `apps/desktop/src/daemon/adapters/claude.ts:273`, `apps/desktop/src/daemon/adapters/claude.ts:310`, `apps/desktop/src/daemon/adapters/claude.ts:322`, `apps/desktop/src/daemon/daemon.ts:259`, `apps/desktop/src/daemon/main.ts:37`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:108`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:111`; executed `git grep -n -e 'still ends' -e 'picks the run up' -- seal/threads/1795339000-sessions-outlive-the-daemon`
reopens: round-1#1
```

Why it matters: round 1's close of finding 1 rested on one claim. The claim was that the rows "Ends" at lines 50 and 51 "stand under the opening paragraph, so this fix covers them without a change of their own". That holds for the pane column. It does not hold for the role-session column. A pane's process ends at a crash because the kernel hangs up its terminal. A role session has no terminal. The adapter starts the CLI with `detached: true`, so it leads a process group of its own, and with its input pipe already ended after one line (`apps/desktop/src/daemon/adapters/claude.ts:273`, `:310`). At a stop, the daemon stops each role session and waits for it: `close` sends SIGTERM and then SIGKILL after 2 seconds, and `stop` awaits `close` before the process exits (`apps/desktop/src/daemon/adapters/claude.ts:322`, `apps/desktop/src/daemon/daemon.ts:259`, `apps/desktop/src/daemon/main.ts:37`). So line 50's "Ends" holds. At a crash, the daemon runs no code, and nothing sends that signal. Whether the CLI then ends, on the broken output pipe or at all, was not run. The cell "Ends" at line 51 states it anyway. The frame states the same thing unrun, for way A (`frame/design.md:108`, "A role session is no terminal and still ends").

The reader who acts on this is the crafter of #55. The comment the study posted there (`frame/plan.md:111`) has the next daemon pick a cut run up "without a person" after a crash and start the cut stage again. If the cut stage's CLI is still running, two agents then work in one worktree. Line 44 now names only the processes that take the hangup of their terminal, so it no longer says anything of a role session. Neither edition says what happens to one at a crash.

The snippet covers both editions and adds a `gaps.md` row with the answerer. It leaves two statements standing. One is `frame/design.md:108`, the framer's row of way A. The other is the comment already posted on #55. Agents post nothing, so the orchestrator owes #55 a follow-up comment that names the condition. `changelog.md:5` states the pane case alone and needs no change.

```markdown
docs/architecture.md:44, after "Whether a Claude Code pane takes it has not been run, and the first real session of issue #61's work answers it.":
A role session has no terminal and leads a process group of its own. A stop of the daemon signals it and waits for its end, and whether it ends when the daemon crashes has not been run.

docs/architecture.ko.md:44, after "Claude Code 칸이 그 신호에 끝나는지는 아직 돌려 보지 않았고, 이슈 #61 작업의 첫 실제 세션이 답합니다.":
역할 세션은 터미널이 없고 자기 프로세스 그룹을 따로 이끕니다. 데몬이 멈출 때는 신호를 보내고 끝나기를 기다리지만, 데몬이 죽을 때 역할 세션이 끝나는지는 돌려 보지 않았습니다.

docs/architecture.md:51, the third cell:
Ends with the Mac. After a crash of the daemon, not run

docs/architecture.ko.md:51, the third cell:
Mac과 함께 끝납니다. 데몬이 죽은 뒤에는 돌려 보지 않았습니다

seal/threads/1795339000-sessions-outlive-the-daemon/gaps.md, a row after line 10:
| Whether a role session ends when its daemon crashes: the adapter starts the CLI detached, with its input already ended, and nothing signals it at a crash (`apps/desktop/src/daemon/adapters/claude.ts:273`, `:310`) | Issue #55's work, which picks a run up after a crash and must not start the cut stage beside a session that still runs |
```

```seal
verdict: fixed 0fdd032
answer: Both editions at line 44 now say a role session has no terminal, that a stop of the daemon signals it and waits for its end, and that its end at a crash was not run. The table's role-session cell at line 51 reads "Ends with the Mac. After a crash of the daemon, not run" in English and the same in Korean, and gaps.md has the row with issue #55's work as the answerer. Heading lines stay 27 and table lines 122 in each edition. Frame/design.md:108 stays the framer's. The orchestrator posts the follow-up comment on #55, which makes no commit.
```

### 2. The handover row now says the inheriting process "took a resize", while the Korean edition says it sent one, and neither says the pane took the new size

```seal
severity: should
location: `docs/architecture.md:62`, `docs/architecture.ko.md:62`, `seal/threads/1795339000-sessions-outlive-the-daemon/trail/phases/fix-1.md:12`
evidence: read `docs/architecture.md:62`, `docs/architecture.ko.md:62`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:57`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:166`
regression: round-1#3
```

Why it matters: the unit is the last sentences of the cost cell of "Handing each terminal's descriptor to the next daemon". The frame (`frame/design.md:57`) says the second process called node-pty's native `resize` on the inherited descriptor and the pane then "printed the new size, 30 rows by 100 columns". The plan's sentence said the pane "took a resize". The fix applied round 1's snippet as written. That snippet moved the subject of "took a resize" from the pane to the inheriting process: "a process that inherited its descriptor from the holder read it and took a resize". In English, "took" says that process received the resize. The Korean cell says the process "보냈습니다" (sent) one. So the two editions differ. Neither now says that the resize reached the pane, and that fact is the one the study established. The *Open decisions* row calls this way "The first to weigh", and whoever weighs it asks whether a resize through an inherited descriptor works. `fix-1.md:12` quotes the same wording.

```markdown
docs/architecture.md:62, the third sentence from the end of the cost cell:
A stand-in pane outlived its holder, and a process that inherited the pane's descriptor from the holder read the pane and resized it (probed 2026-11-22).

docs/architecture.ko.md:62, the same sentence:
대신 세운 칸은 그것을 쥐던 프로세스가 끝난 뒤에도 살았고, 그 프로세스에게서 칸의 디스크립터를 물려받은 프로세스가 칸을 읽고 칸의 크기를 바꿨습니다(2026-11-22 실험).

seal/threads/1795339000-sessions-outlive-the-daemon/trail/phases/fix-1.md:12: the "Now" cell takes the same words, unless finding 3's fix removes the file.
```

```seal
verdict: fixed 0fdd032
answer: Both editions at line 62 now say the inheriting process read the pane and resized it, and that the pane took the new size, which is what frame/design.md:57 records. The two editions say the same. The fix-1.md cell the finding names is gone with the file (finding 3).
```

### 3. `fix-1.md` records the departures from the plan's blocks beside them, so the plan states a text the tree does not hold and the next reader has two to choose between

```seal
severity: should
location: `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:148`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:157`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:166`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:169`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:181`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:197`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:206`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:215`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:218`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:230`, `seal/threads/1795339000-sessions-outlive-the-daemon/trail/phases/fix-1.md`
evidence: executed `python3 -I <scratchpad>/1795339000-sessions-outlive-the-daemon/round-2/test_tmp_departures.py <the branch worktree>`; read `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:133`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:85`, `seal/threads/1795339000-sessions-outlive-the-daemon/trail/phases/fix-1.md:5`, `seal/threads/1795339000-sessions-outlive-the-daemon/trail/phases/fix-1.md:22`, the plugin's `skills/implement/SKILL.md:121`, the plugin's `skills/implement/fix-pass.md:53`
regression: round-1
```

Why it matters: the unit is `trail/phases/fix-1.md`, which the fix pass added and no finding named. `frame/plan.md:133` says "The session writes the edits below into each edition", and `frame/design.md:85` makes Scope item 3 "the text ... as `frame/plan.md` *The text placed in the policy documents* gives it". Those sentences say what the work does. By the plugin's `skills/implement/SKILL.md:121` to `:123`, the reader holds such a sentence against HEAD, and a fold rewrites it with the fact it states. Round 1 offered two ways: change the blocks, or record the departure in a phase record. The fix pass took the second. Under it, ten sentences of the plan's blocks state a text that neither edition holds. The probe lists eleven departing spans, which are exactly `fix-1.md`'s six rows in each edition. The correction stands in another file. Contract rule 19 names this case: "A correction written beside the sentence it corrects leaves both for the next reader to choose between". The sealer reads Scope item 3 against the blocks, and it then has to merge the two by hand. Second, the plugin's `skills/implement/fix-pass.md:53` says "A fix pass appends close blocks and writes no phase record". `fix-1.md:22` restates that as "writes none by default", which the rule does not say. A spawn prompt cannot widen what an agent writes (contract rules 3 and 6). The list itself is accurate and whole, which the probe confirms, so the defect is where it stands and not what it says.

Who writes the fix is the orchestrator's choice. The blocks are the framer's file. Under `agentic`, the orchestrator may have the session write them or spawn the framer again. The fix copies each departed line of the docs into the block line it came from, after findings 1 and 2 of this round are applied. Each block then holds the text the tree holds, and `plan.md:133` and Scope item 3 stay true. The same commit removes `fix-1.md`, because its table would then list departures that no longer exist. Its decision bullets are already restated by round 1's close answers and by the grounds of round 1's findings.

```markdown
In frame/plan.md, replace each block line with the line of the docs it was placed as, at the commit that applies findings 1 and 2 of this round:

frame/plan.md:148 takes docs/architecture.md:44
frame/plan.md:155 takes docs/architecture.md:51 (finding 1 changes it)
frame/plan.md:157 takes docs/architecture.md:53, with "Issue #133" written back as "Issue #DAEMON-ISSUE"
frame/plan.md:166 takes docs/architecture.md:62
frame/plan.md:169 takes docs/architecture.md:65
frame/plan.md:181 takes docs/architecture.md:393
frame/plan.md:197 takes docs/architecture.ko.md:44
frame/plan.md:204 takes docs/architecture.ko.md:51 (finding 1 changes it)
frame/plan.md:206 takes docs/architecture.ko.md:53, with "이슈 #133이" written back as "이슈 #DAEMON-ISSUE이"
frame/plan.md:215 takes docs/architecture.ko.md:62
frame/plan.md:218 takes docs/architecture.ko.md:65
frame/plan.md:230 takes docs/architecture.ko.md:393

Then delete seal/threads/1795339000-sessions-outlive-the-daemon/trail/phases/fix-1.md.
Check: the round-2 probe, run again, prints "departing spans: 0".
```

```seal
verdict: fixed 797d49a
answer: trail/phases/fix-1.md is deleted, so no record lists a departure beside the plan's blocks. A fix pass writes no phase record, and the earlier prompt that asked for one was wrong. The plan's blocks are the framer's and are synced to the docs in the next commit, which the orchestrator makes after this pass; this fix pass did not edit frame/.
```

## Confirmations

```seal
confirms: round-1#2
```
What holds: `docs/architecture.md:53` and `docs/architecture.ko.md:53` say the daemon writes its line when it stops, that a crashed daemon writes nothing, and that the next daemon writes that the one before it ended without stopping. This matches the *Done when* of #133 as `frame/plan.md:78` gives it. The *Open decisions* cell at `:393` of each edition separates a restart that ended a working agent from a crash. The Korean particle reads "이슈 #133이". `changelog.md:7` reads "the log lines at each stop and after a crash". The two editions say the same in each changed sentence (read). The probe confirms that these are the only departures in those lines (executed).

```seal
confirms: round-1#3
```
What holds: the cost cell at `docs/architecture.md:62` no longer says a stand-in pane lived through a handover. It states that the pane outlived its holder, and that a handover to a daemon the stopping one did not start was not run, as `frame/design.md:57` records (read). The wording defect the fix brought into the same cell is finding 2.

```seal
confirms: round-1#4
```
What holds: the second cell at `docs/architecture.md:65` and `docs/architecture.ko.md:65` limits the background session to a restart or a crash of the daemon. It gives survival as the study's expectation from `claude --help` of 2.1.330, not run, which agrees with `frame/design.md:113` and `frame/questions.md:22` (read). The two editions say the same.

```seal
confirms: round-1#5
```
What holds: both editions at `:53` carry the sentence that a kept daemon goes on reading its own build's script, node-pty's native files and the role bundle. The sentence says the packaged app runs the daemon from files the update does not replace, and that #78 builds and checks it. That is the condition of `frame/design.md:141`. It stands right after the sentence on the window reading a missing field (read). The development-build case of `frame/plan.md:20` is outside it, and it stays out, because the section's table describes the events once #133 and #78 are built.

```seal
confirms: round-1#6
```
What holds: `gaps.md` stands with the headings of `templates/records/sdd-gaps.md`. Its four rows are `frame/questions.md` Q1, Q2 and Q4 and the subagent `session_id` item of the #61 comment (`frame/plan.md:98`), each with the answerer those records name. The "Not verified:" heading and its two items are gone from `pr.md`. What remains of `pr.md` says only what the records say: its *Done when* rows point at `frame/design.md`, at the docs' section and at the issues round 1 read, and its Q5 line is `frame/questions.md:25`'s default (read).

What matched: each edition has 27 heading lines and 122 table lines at `2e11f24`, the same as each other and as at `e7a6ca3`. The probe counted them (executed). The fix diff adds no link and removes none, so the twelve anchors round 1 resolved stand as they were (read, from the diff).

What matched: `fix-1.md`'s table lists every place the docs depart from the plan's blocks. The probe compares each block, with `#133` in place of the token, sentence by sentence against the lines it became, and finds eleven departing spans in all. Each span falls in one of the table's six rows in each edition. Edits 1 and 3 do not depart (executed). Finding 3 is about where that list stands, not about its content.

What matched: `changelog.md:5` names the hangup condition and that no one has run it for a Claude Code pane, as `docs/architecture.md:44` does. `changelog.md:3` and `:6` are unchanged and agree with the section (read).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at HEAD, the document arm of `seal/config.json`'s `Broad gate` included. The round counted the heading and table lines through its probe and ran no part of the gate, so the suite is `unverified` | `seal/config.json` | the orchestrator's broad run |
| Whether a role session's CLI ends when its daemon crashes, on the broken output pipe or otherwise | `apps/desktop/src/daemon/adapters/claude.ts:273` | issue #55's work, as finding 1's `gaps.md` row gives it |
| Whether a pseudo-terminal's descriptor can be handed to a daemon the stopping daemon did not start, carried from round 1 | `docs/architecture.md:62` | whoever weighs the *Open decisions* row at `docs/architecture.md:393` |
| The research rows of `frame/design.md` *What the research says*, which cite files in the main clone that are not in this tree, carried from round 1 | `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:65` | the sealer, reading against issue #36 |

## Probes

| Command | Result |
|---|---|
| `python3 -I <scratchpad>/1795339000-sessions-outlive-the-daemon/round-2/test_tmp_departures.py <the branch worktree>` | The probe found each of the plan's 8 blocks once at HEAD. It printed eleven departing spans, five in English and six in Korean, which match the six rows of `fix-1.md` in each edition. Heading lines were 27 and 27, and table lines 122 and 122. Exit 0 |
| `git grep -n -e 'still ends' -e 'picks the run up' -- seal/threads/1795339000-sessions-outlive-the-daemon` | Two lines printed: `frame/design.md:108` and `frame/plan.md:111` |
