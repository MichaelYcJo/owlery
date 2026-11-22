# Review round 3: 1795339000-sessions-outlive-the-daemon

```seal
target: 69893d1, fixes 2176f3d..69893d1
```

This is a verifying round. It answers the three findings round 2 closed: findings 1 and 2 `fixed 0fdd032`, and finding 3 `fixed 797d49a` with the plan's blocks synced by the orchestrator's fold at `69893d1`. It reviews the fix diff `2176f3d..69893d1` as new text. That diff changes line 44, line 51 and line 62 of each edition, row A of `frame/design.md:108`, `frame/plan.md` (the synced blocks, the note at `:106` and the fold row at `:251`), one new row of `gaps.md`, the close blocks of `round-2.md`, and it deletes `trail/phases/fix-1.md`. The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-3.md` whole at `69893d1`, and `trail/rounds/round-1.md` and `round-2.md` for their coordinates. The work item has no `pr.<lang>.md`, which is right, because `Commit and pull request language` is English in `seal/config.json`. No `seal/parity.json` is declared.

Facts carried from rounds 1 and 2 and not established again: the comments on #61 and #78 match `frame/plan.md` items 2 and 4; issue #133 is open in `release: 0.0.3`; the twelve anchors round 1 resolved stand, since the fix diff adds and removes no link (read, from the diff). The adapter's coordinates round 2 named were opened again because the fix diff states them in prose. `apps/desktop/src/daemon/adapters/claude.ts:273` starts the CLI with `detached: true`. `:310` ends its input after one line. `:322` to `:328` send SIGTERM to the group and SIGKILL after `KILL_AFTER_MS`, which is 2000 at `:20`. `apps/desktop/src/daemon/daemon.ts:259` to `:267` await each run's stop, and `apps/desktop/src/daemon/main.ts:37` awaits that close before `process.exit` (read).

One boundary of the new sentence at `docs/architecture.md:44` is noted and not raised. The sentence reads "A stop of the daemon signals it and waits for its end". `apps/desktop/src/daemon/daemon.ts:257` says a run whose adapter is still starting "is stopped once it has started, and the close does not wait for it", and `:966` stops it without awaiting. So the stop does not wait for a run that was still starting, and `process.exit` can come before the SIGKILL timer fires. The check finding 1 below asks for covers that case too, so the round names it here and opens no finding of its own.

The #55 correction was read with `gh issue view 55 --repo MichaelYcJo/owlery --comments` (executed). It is posted below the study's comment. It says the daemon that starts next "checks that the earlier stage's process no longer runs in that worktree, and ends it or waits where it still does, so that no worktree holds two agents at once". That is the follow-up round 2's finding 1 owed, and `frame/plan.md:106` records it. That decision is the subject of finding 1: it stands in the issue comment and in the plan's note, and not in the policy text.

## Findings

### 1. The policy text has a run start its cut stage again with no check that the cut stage's process is gone, while the decision posted on #55 makes that check part of the study's recommendation

```seal
severity: should
location: `docs/architecture.md:55`, `docs/architecture.ko.md:55`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:161`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:210`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:132`
evidence: read `docs/architecture.md:44`, `docs/architecture.md:51`, `docs/architecture.md:55`, `docs/architecture.ko.md:55`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:106`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:251`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:132`, `seal/threads/1795339000-sessions-outlive-the-daemon/gaps.md:11`, the plugin's `skills/implement/orchestration.md:58`; executed `gh issue view 55 --repo MichaelYcJo/owlery --comments`, `grep -n "starts the cut stage again\|끊긴 단계를 다시" docs/architecture.md docs/architecture.ko.md seal/threads/1795339000-sessions-outlive-the-daemon/frame/*.md`
```

Why it matters: the fix at `0fdd032` made line 44 say that whether a role session ends when its daemon crashes has not been run, and line 51 say the same in the table. Line 55 of each edition still states the run's rule with no condition: "A run of the AgenticSeal process that the daemon's end cut starts the cut stage again from the records, which are committed." The same paragraph gives the panes a check before a resume, so that "one conversation is not opened in two processes". The run gets no such check. After the fix, the section therefore says a role session may outlive a crash, and then says the next daemon starts the cut stage again with nothing in between.

The orchestrator settled that gap on #55. Its correction says the next daemon checks that the earlier stage's process no longer runs in the worktree, "and ends it or waits where it still does". That is a decision about what the study recommends. `frame/plan.md:106` records it only as a note on what was posted. `frame/plan.md:251` says the fold took rounds 1 and 2 into the frame. The plugin's `skills/implement/orchestration.md:58` says a decision made after the frame is committed "is folded, in place, into `frame/design.md` or `plan.md`", and an issue comment is one of the examples it lists. The decision is not in `frame/design.md` *The recommendation*, part 2 (`:132`), and it is not in the policy blocks of `frame/plan.md` (`:161`, `:210`) or in the documents they were placed as. So the check has one home, an issue comment, while the policy document that outranks it states the rule without it.

The reader who acts on this is the framer of #55. `docs/architecture.md` *What a session survives* is the source the #55 comment itself cites. A framer who reads the policy first frames a pick-up after a crash that starts the cut stage at once, and two agents can then work in one worktree. That is the defect round 2's finding 1 named. `gaps.md:11` names the risk as an open item, and the issue comment holds the remedy, but the policy holds neither.

The snippet writes the sentence into both editions and into the plan's two blocks, so the blocks and the documents stay byte for byte the same (the round-3 probe checks that). It also writes the sentence into the design's part 2, which is the framer's file under the fold rule, so the orchestrator chooses who writes it. The table at line 51 needs no change, because its fourth cell "The same" points at the row above, and line 55 now carries the condition. `changelog.md:7` says #55 builds "the restart of a run's cut stage" and needs no change. Heading and table line counts do not move.

```markdown
docs/architecture.md:55 and frame/plan.md:161, after "A run of the AgenticSeal process that the daemon's end cut starts the cut stage again from the records, which are committed.":
Before it does, the daemon checks that the cut stage's process no longer runs in that worktree, and ends it or waits where it still does, since whether a role session ends when its daemon crashes has not been run and one worktree does not hold two agents.

docs/architecture.ko.md:55 and frame/plan.md:210, after "데몬이 끝나면서 끊긴 AgenticSeal 프로세스의 실행은 커밋된 기록에서 끊긴 단계를 다시 시작합니다.":
그러기 전에 데몬은 끊긴 단계의 프로세스가 그 워크트리에서 더는 돌지 않는지 확인하고, 아직 돌면 끝내거나 기다립니다. 데몬이 죽을 때 역할 세션이 끝나는지는 돌려 보지 않았고, 한 워크트리에 에이전트 둘을 두지 않기 때문입니다.

frame/design.md:132, after "For a role session the same idea holds one level up: the run starts the cut stage again from the records, which are committed, and issue #55 already asks for it after a restart of the daemon.":
Before it does, the daemon checks that the cut stage's process no longer runs in that worktree, and ends it or waits where it still does, because a role session's end at a crash of the daemon was not run (row A of *The ways compared*); the correction posted on #55 on 2026-11-22 says the same.

Check: the round-3 probe, run again, prints "departing spans: 0", and each edition keeps 27 heading lines and 122 table lines.
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: `docs/architecture.md:44` and `docs/architecture.ko.md:44` now say a role session has no terminal and leads a process group of its own, that a stop of the daemon signals it and waits for its end, and that its end at a crash was not run. The role-session cell at `:51` reads "Ends with the Mac. After a crash of the daemon, not run", and the Korean cell says the same. The adapter's coordinates support each clause apart from the boundary noted above (read). `gaps.md:11` holds the row with issue #55's work as its answerer. `frame/design.md:108`, which round 2 left to the framer, now reads "a stop of the daemon still ends it, and its end at a crash was not run", in line with the docs (read). The follow-up comment on #55 is posted (executed). The remedy that comment states is not in the policy text, and that is finding 1, in a sentence the fix did not change.

```seal
confirms: round-2#2
```
What holds: `docs/architecture.md:62` says "a process that inherited the pane's descriptor from the holder read the pane and resized it, and the pane took the new size". `docs/architecture.ko.md:62` says "칸을 읽고 칸의 크기를 바꿨으며, 칸은 새 크기를 받았습니다". The two editions say the same thing, and both state the fact of `frame/design.md:57`, that the pane printed the new size after the native `resize` call (read). `git grep -n -e 'took a resize' -e '보냈습니다'` over `docs/` and the work item prints only the round records that quote it (executed).

```seal
confirms: round-2#3
```
What holds: `trail/phases/fix-1.md` is gone at `797d49a`, and no file of the work item outside `round-1.md`, `round-2.md` and the fold row at `frame/plan.md:251` names it (executed, `git grep -n -e 'fix-1'`). The fold synced the plan's eight blocks to the documents. The round-2 probe, written again as the round-3 probe, finds each block once at HEAD, finds every block byte for byte equal to the lines it became, and prints "departing spans: 0" (executed). `frame/plan.md:135` now says the blocks hold #133 and were synced after rounds 1 and 2. That sentence is true at HEAD. The round-1 close answers still say "trail/phases/fix-1.md lists the departure". Those records are not edited, and `frame/plan.md:251` says the answers that name the file point at the synced blocks, so the reader is sent to the right place (read).

What matched: each edition has 27 heading lines and 122 table lines at `69893d1`, the same as at `2176f3d` (executed, the round-3 probe).

What matched: `changelog.md:5` names the hangup condition and says no one has run it for a Claude Code pane. It says nothing of a role session at a crash, which round 2 judged needs no change. `pr.md` quotes no source, so no quote of it is owed a match (read).

What matched: the phase record `trail/phases/phase-3.md:5` says the text "was placed word for word". That sentence is dated to the phase, and at HEAD the documents again equal the plan's blocks byte for byte, so the target does not contradict it (executed, the round-3 probe).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at HEAD, the document arm of `seal/config.json`'s `Broad gate` included. The round counted heading and table lines through its probe and ran no part of the gate, so the suite is `unverified` | `seal/config.json` | the orchestrator's broad run |
| Whether a role session's CLI ends when its daemon crashes, on the broken output pipe or otherwise, carried from round 2 | `apps/desktop/src/daemon/adapters/claude.ts:273` | issue #55's work, as `gaps.md:11` gives it |
| Whether a pseudo-terminal's descriptor can be handed to a daemon the stopping daemon did not start, carried from round 1 | `docs/architecture.md:62` | whoever weighs the *Open decisions* row at `docs/architecture.md:393` |
| The research rows of `frame/design.md` *What the research says*, which cite files in the main clone that are not in this tree, carried from round 1 | `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:65` | the sealer, reading against issue #36 |

## Probes

| Command | Result |
|---|---|
| `python3 -I <scratchpad>/1795339000-sessions-outlive-the-daemon/round-3/test_tmp_departures.py <the branch worktree>` | Written again from round 2's row, with a byte comparison added. It found 4 blocks in each edition, each once at HEAD, and no block differed byte for byte. It printed "departing spans: 0". Heading lines were 27 and 27, and table lines 122 and 122. Exit 0 |
| `gh issue view 55 --repo MichaelYcJo/owlery --comments` | Two comments by the owner: the study's comment as `frame/plan.md:111` to `:116` gives it, and the correction of 2026-11-22 quoted above |
| `git grep -n -e 'fix-1' -- seal/threads/1795339000-sessions-outlive-the-daemon` | Lines of `frame/plan.md:251`, `round-1.md` (five close answers) and `round-2.md` only |
| `git grep -n -e 'took a resize' -e '보냈습니다' -- docs seal/threads/1795339000-sessions-outlive-the-daemon` | Lines of `round-1.md` and `round-2.md` only, none in `docs/` or in the frame |
