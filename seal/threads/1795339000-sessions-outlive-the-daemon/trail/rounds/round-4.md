# Review round 4: 1795339000-sessions-outlive-the-daemon

```seal
target: ae9e455, fixes ea61b55..ae9e455
```

This is a verifying round. It answers the one finding round 3 closed, finding 1, `fixed dba18c4`, with the frame synced by the orchestrator's fold at `ae9e455`. It reviews the fix diff `ea61b55..ae9e455` as new text. `dba18c4` changes line 55 of each edition and nothing else. `608c4c8` appends the close block to `round-3.md`. `ae9e455` changes `frame/design.md:132` and the blocks at `frame/plan.md:161` and `:210`, and it adds the fold row at `frame/plan.md:252` (executed, `git show --stat`).

The spawn prompt narrowed the read to the fix diff and to what it touches. The round read `gaps.md`, `changelog.md`, `pr.md` and `routing.md` whole at `ae9e455`, together with `frame/design.md:100` to `:150` and `frame/plan.md:100` to `:140` and `:240` to `:252`. It did not read `frame/questions.md`, `trail/phases/phase-3.md` or the rest of the two frame files again, since the diff does not touch them. The work item still has no `pr.<lang>.md`, which is right while `Commit and pull request language` is English. No `seal/parity.json` is declared.

Facts carried from round 3 and not established again: the wording of the correction posted on #55 on 2026-11-22, from round 3's `gh issue view 55` row; the adapter's coordinates at `apps/desktop/src/daemon/adapters/claude.ts:273` and `:310`, which the fix diff does not state; and the twelve anchors round 1 resolved, since the fix diff adds and removes no link (read, from the diff).

The orchestrator's account says the round-3 departures probe at `ae9e455` printed "departing spans: 0", 27 and 27 heading lines and 122 and 122 table lines. The round wrote the probe again from round 3's row and ran it once, and it printed the same (executed, `## Probes`).

## Findings

None. The fix diff opens no finding.

## Confirmations

```seal
confirms: round-3#1
```
What holds: `docs/architecture.md:55` now says, after the sentence on the cut stage, "Before it does, the daemon checks that the cut stage's process no longer runs in that worktree, and ends it or waits where it still does, since whether a role session ends when its daemon crashes has not been run and one worktree does not hold two agents." `docs/architecture.ko.md:55` says the same in two sentences: the check, then its two grounds under one `때문입니다`. Both match round 3's snippet word for word (read). The check now stands in the policy beside the panes' own check, so a framer of #55 who reads the policy first finds it there. Before, it stood only in an issue comment. `frame/design.md:132` carries the check in part 2 of *The recommendation*. It cites row A, and row A at `frame/design.md:108` says "its end at a crash was not run", so the citation holds (read). The plan's blocks at `frame/plan.md:161` and `:210` equal the lines they became byte for byte, and each edition keeps 27 heading lines and 122 table lines (executed, the round-4 probe). The close answer says the fix pass did not edit the frame. `git show --stat dba18c4` lists the two editions only (executed).

What matched: the fold row at `frame/plan.md:252` says the check is part of the recommendation, "in *The recommendation* part 2 and the synced text blocks". It names round 3 as its grounds and the plugin's fold rule as what it was judged against. Each of those places holds the check at `ae9e455` (read).

What matched: no other statement of the restart of a run's cut stage contradicts the new sentence (executed, `git grep` for "cut stage" and "끊긴 단계"). The table cell at `docs/architecture.md:50` and its Korean twin say "a run starts the cut stage again" for a restart a person chose, and line 55 states the condition for every restart. `frame/design.md:142` says the same of a restart a person chose. The #55 comment block at `frame/plan.md:111` to `:116` records the text as posted, and the note at `frame/plan.md:106` names the correction. `gaps.md:11` keeps the open question for issue #55's work, and its wording, "must not start the cut stage beside a session that still runs", agrees with the check. `changelog.md:7` and `pr.md` state nothing the check changes (read).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at HEAD, the document arm of `seal/config.json`'s `Broad gate` included. The round counted heading and table lines through its probe and ran no part of the gate, so the suite is `unverified` | `seal/config.json` | the orchestrator's broad run |
| Whether a role session's CLI ends when its daemon crashes, carried from rounds 2 and 3 | `apps/desktop/src/daemon/adapters/claude.ts:273` | issue #55's work, as `gaps.md:11` gives it |
| Whether a pseudo-terminal's descriptor can be handed to a daemon the stopping daemon did not start, carried from round 1 | `docs/architecture.md:62` | whoever weighs the *Open decisions* row at `docs/architecture.md:393` |
| The research rows of `frame/design.md` *What the research says*, which cite files in the main clone that are not in this tree, carried from round 1 | `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:65` | the sealer, reading against issue #36 |

This round leaves nothing open. What comes due next is the orchestrator's broad run at HEAD, and the sealer's spawn after it.

## Probes

| Command | Result |
|---|---|
| `python3 -I <scratchpad>/1795339000-sessions-outlive-the-daemon/round-4/test_tmp_departures.py <the branch worktree>` | Written again from round 3's row. It found 4 blocks in each edition, each once at HEAD, and no block differed byte for byte. It printed "departing spans: 0". Heading lines were 27 and 27, and table lines 122 and 122. Exit 0 |
| `git show --stat dba18c4 608c4c8 ae9e455` | `dba18c4`: the two editions only. `608c4c8`: `round-3.md` only. `ae9e455`: `frame/design.md` and `frame/plan.md` only |
| `git grep -n -e 'cut stage' -e '끊긴 단계' -- docs README.md README.ko.md seal/threads/1795339000-sessions-outlive-the-daemon` with the round records excluded | Lines 50 and 55 of each edition, `changelog.md:7`, `frame/design.md:132` and `:142`, `frame/plan.md:39`, `:114`, `:115`, `:128`, `:156`, `:161`, `:205`, `:210` and `:252`, `frame/questions.md:23` and `gaps.md:11`. None states a restart of the cut stage without the check where the check is owed |
