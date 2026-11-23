# Review round 3: 1795393338-broad-gate-and-sealer

```seal
target: de0db0b, fixes b7621c1..de0db0b
```

This is a verifying round. The code it reviews is the diff of the fix pass of round 2, `b7621c1..de0db0b`, read whole: `15c4513`, `ec508ee`, the round record `8781f49` and the close blocks of `de0db0b`. Beside that bound, the round read `routing.md`, `changelog.md`, `gaps.md`, `frame/design.md`, `frame/plan.md` and `frame/questions.md` whole at `de0db0b`, and the four phase records for what they say of the trailer. No `pr.md` and no `pr.<lang>.md` stand at the target, and the repository declares no `seal/parity.json`.

Carried from round 2, not established again: what git prints for `git log --first-parent` after a fast-forward, a rebase and a `--no-ff` merge of a base whose line holds another work item's fix-pass commit (round 2 *Probes*, `test_tmp_trailers_ff.sh`); the clause of `docs/roadmap.md` *Releases and the tracker* that gives a stale bullet to the work item that makes it untrue; and the read of all 22 changelog fragments of the release. The new case of `test/worktrees.test.ts` replays the probe's fast-forward and rebase, so the run named under *Probes* stands for a re-run of its `evidence: executed` line. Established in this round: the rest below. Of the fragments, this round read whole again the four the fix pass rewrote, and the three bullets `gaps.md:46` names as standing.

The two branches that `gaps.md:66` leaves uncovered are residuals this work may ship with the memo, and the round opens no finding for either. Neither arises from anything Owlery does. No code of the daemon runs `git merge` or `git rebase`; the one place that names them refuses a person's word while one is under way (`daemon.ts:1873`). So each state comes from a git command a person types. The grounds for each:

- **A fast-forward or a rebase onto commits that the local base does not hold.** A work item's default base is a remote's branch (`worktrees.ts:440-452`, `basesOf`), which Owlery fetches at the cut and for the inbox's count. Once fetched, that ref holds what a rebase onto it brings, and `^<base>` excludes it. So the state needs a base the person chose as a local branch, and then a rebase onto a newer remote branch that the person did not pull into it. A fast-forward lands only before the first start commits `routing.md` (round 2 finding 1). The trailer then misnames a builder only where the base's own line keeps another work item's fix-pass commit with its trailers, as a rebase merge does. Round 2's search found no such commit in this repository's history. In that state the sealer's diff is read against the same base, `base...<gate's commit>` (`daemon.ts:2469-2470`, `worktrees.ts:1009-1012`), and holds the same foreign commits. The extra `built-by:` name therefore matches the diff the sealer judged. The defect of that state is the base, which the rounds read the same way (`daemon.ts:2304`), and the trailer read does not cause it.
- **A base that already holds the work item's commits.** That state comes after the branch is merged into its base, by the pull request or by the person, and #43 opens the pull request only after the seal (`frame/design.md` *Out of scope*). The read then names fewer builders, and fails closed where it names none: `seal-records.ts:228` throws "no session is named as having built the work", and the stage writes nothing. The sealer's diff is empty in the same state, as `gaps.md:66` says. The memo gives a local merge as the cause. A remote base that already holds the merged branch reaches the same state, and the memo does not name it. The settle reads that sentence and acts on nothing in it, so it is no finding.

The core's rule *The rule a mechanism is kept against* asks what a mechanism decides once fixes chase its edge cases. This read has now had two fixes, the first-parent walk and then the base's exclusion. `gaps.md:66` names the read that ends the chase: keep `Seal-Built-By:` only from a commit whose `Seal-Routing:` names this work item's directory. That is an exact read of the daemon's own trailer, and it would also make the exclusion unneeded. With both residuals outside Owlery's flow, the choice is the orchestrator's to make, or #44's, and this round raises no finding to force it.

## Findings

None. Each close of round 2 holds against the tree, and the fix diff adds no defect this round found.

## Confirmations

```seal
confirms: round-2#1
```
What holds: `trailerValues` takes a list `outside` and passes `^<name>` for each of them after `to` (`worktrees.ts:987-988`). `Daemon#runSeal` passes `[baseCommit, base]`, where `base` is the same value the sealer's diff is read against (`daemon.ts:2469` and `:2485`). The docstring of `trailerValues` (`worktrees.ts:974-986`) and that of `runSeal` (`daemon.ts:2446-2452`) say the new range, and the first names the commit that only another name holds as still read. The other statements round 2 listed all say the new range: the calls of the two older cases at `worktrees.test.ts:1076-1079` and `:1092`, the bullet at `changelog.md:13`, the memo at `gaps.md:66`, *Scope* item 16 at `frame/design.md:133`, and *Data & interfaces* at `frame/design.md:291`. Each sentence matches the code. Claimed in the close: each new case was shown red by `seal mutate`. Read, not re-run here. Against the old read, the round 2 probe's own sequence prints `s-other` before the work item's value, which is the failure the close quotes. The close says that the rebase assertion of the first case was not shown red on its own. By the same probe, it prints `s-other s-rebased` under the old read, so it would fail too. Executed: `test/worktrees.test.ts` and `test/chain.test.ts` through the lock, 225 of 225 passed (*Probes*).

```seal
confirms: round-2#2
```
What holds: the bullet at `seal/threads/1795338001-records-place-and-pr-check/changelog.md:17` now says that the app writes and shows a work item's decisions and questions. It says that #119 builds the inbox line, the reversal and the answer on the daemon's code, and that the stages of "Get a seal" write the decisions and the questions. The rulings write decisions and parks (`daemon.ts:2404-2417`), the sealer's `undecided` verdict reaches them (`daemon.ts:2491`, `:2497`), and the bullet is true at the target. The memo at `gaps.md:46` names five rewritten bullets, the fourth with its cause, and *Scope* item 29 at `frame/design.md:164` names the fifth fragment. Read.

```seal
confirms: round-2#3
```
What holds: `seal/threads/1795330500-no-question-holds-the-run/changelog.md:15` says that the convergence judgment is listed as "Route", and that the route chosen before a work item's first edit records no decision yet (#51). The judgment records the kind `route` (`daemon.ts:2384`), the window says "Route" (`view.ts:319`), and a ruling records only `default`, `scope` or `answered` (`chain.ts:651`). `seal/threads/1795338000-role-tools-and-permissions/changelog.md:7` names the orchestrator twice: among the roles whose commands are refused, which matches `role-grants.ts:35`, and among the sessions the stages launch, which matches `daemon.ts:2382` and `:2407`. The two bullets of `seal/threads/1795329620-role-bundle/changelog.md:5` and `:7` say four roles. `ROLE_STAGES` lists four pairs (`protocol.ts:432-437`), and the bundle holds four definitions under `apps/desktop/role-bundle/agents/`. Read.

What matched: the three bullets that `gaps.md:46` leaves standing are untrue from #41's cause alone, by round 2's test. This branch changes nothing of `role-grants.ts`, adds no pair to `ROLE_STAGES` and no tool to a role in `adapters/claude.ts` (executed: `git diff 7641741..HEAD` over those files). The sealer reads no reversal either: the order hands a reversal to a fix pass (`chain.ts:274`). So `seal/threads/1795330500-no-question-holds-the-run/changelog.md:8`, `seal/threads/1795329620-role-bundle/changelog.md:15` and `seal/threads/1795338000-role-tools-and-permissions/changelog.md:5` go to the release's settle, as the orchestrator holds.

What matched: the diff of `gaps.md` adds row 25 of `## Not verified` and rewrites the memos at lines 46 and 66 in place. No row and no memo left. Row 25 names the fix pass's narrow runs and leaves the whole suite and the typecheck to the orchestrator's broad gate, so the `unverified` label is honest. With nothing open after this round, what comes due is the orchestrator's broad run, and the sealer's spawn after it.

The two new cases against their groups. The case of `test/worktrees.test.ts:1095` covers a fast-forward and a rebase against a branch named as outside. The case before it covers a `--no-ff` merge with the base commit alone, so the new case adds what its group does not hold. The case of `test/chain.test.ts:2722` holds the daemon's call, and no other case of the seal's group reads a trailer of the base's line. The `describe` of the first group still reads "the values of a trailer between two commits" (`worktrees.test.ts:1055`), which the list `outside` no longer is. It is a name only the next editor reads.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The bodies of the 126 cases the branch adds, read against their groups, which round 2 left to a later round. This round read the bodies of the two cases the fix pass added, and no other | `apps/desktop/test/` | The orchestrator, who decides whether a later round reads them |
| The three bullets of other fragments that `gaps.md:46` names as untrue from #41's cause | `seal/threads/1795330500-no-question-holds-the-run/changelog.md:8`, `seal/threads/1795329620-role-bundle/changelog.md:15`, `seal/threads/1795338000-role-tools-and-permissions/changelog.md:5` | The orchestrator, at the release's settle |
| The whole suite, the typecheck and the broad gate at the target | the tree at `de0db0b` | The orchestrator's broad gate |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/worktrees.test.ts test/chain.test.ts` in `apps/desktop`, through the lock | Exit 0. 2 files, 225 cases passed |
| `git diff 7641741..HEAD` over `src/daemon/role-grants.ts`, `src/shared/protocol.ts` and `src/daemon/adapters/claude.ts` of `apps/desktop` | `role-grants.ts` unchanged. `ROLE_STAGES` unchanged. In `claude.ts`, no line that names a role's tools changed |
