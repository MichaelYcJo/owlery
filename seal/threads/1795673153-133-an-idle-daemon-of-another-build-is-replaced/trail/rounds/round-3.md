# Review round 3: 1795673153-133-an-idle-daemon-of-another-build-is-replaced

```seal
target: 46066e05, fixes 0f33aba6..46066e05
```

The round reads the commits that follow round 2's target: the record of round 2 (`96ce63db`), the judgment row of a failed stop (`0d1b0c8e`), the test commit `d7b388bb`, the handoff (`50b829e4`) and the judgment row of the account-change cases with the handoff's removal (`46066e05`). Round 2 had no finding, so no close stands for this round to answer. The code it reviews is `d7b388bb`, the one commit of the range outside the records. `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-1.md` and `trail/phases/phase-2.md` were read whole at the target. No `pr.md` stands at the target, and `Commit and pull request language` is English. No `seal/parity.json` is declared.

Carried from rounds 1 and 2 and not re-established: the comparison of `ClientMessage` with `Daemon#handle` (every type has a `case` but `hello`), the reads of the tags `v0.0.2` to `v0.0.4`, and every confirmation of those rounds on code that the range does not touch.

The worktree holds two changes past the target: an uncommitted row of `frame/plan.md` *Judgments of the run* on the title prefix `feat:`, and an untracked `pr.md`. Neither is at the target, so this round reads neither as a record (*Not judged*).

## Findings

### 1. The judgment row says `-t "account"` ran the eight account-change cases that failed in the broad gate, and that filter leaves out three of them

```seal
severity: should
location: `seal/threads/1795673153-133-an-idle-daemon-of-another-build-is-replaced/frame/plan.md:97`
evidence: executed `node scripts/test-in-electron.mjs test/daemon.test.ts -t 'account' --reporter=verbose` and `node scripts/test-in-electron.mjs test/daemon.test.ts -t "account|changed pane|refuses a change whose pane" --reporter=verbose` in `apps/desktop` at the target, `git show 50b829e4:seal/threads/1795673153-133-an-idle-daemon-of-another-build-is-replaced/handoff.md`, and `git grep -n -F -e '-t "account"' -e 'all eight passed' -e 'account-change' 46066e05 -- seal/threads/1795673153-133-an-idle-daemon-of-another-build-is-replaced`; read `apps/desktop/test/daemon.test.ts:8460`, `apps/desktop/test/daemon.test.ts:8997`, `apps/desktop/test/daemon.test.ts:9133`, `apps/desktop/test/daemon.test.ts:9224`
regression: round-2
```

Why it matters: the unit is the fourth row of `frame/plan.md` *Judgments of the run* (`:97`), which `46066e05` added after round 2 with no finding behind it. `frame/plan.md` *Phases* and `frame/design.md` *Scope* say nothing of the broad gate's failures. The row is the orchestrator's ruling that the gate's failures at `0d1b0c8e` were load, and the defect is in the evidence the row gives for that ruling.

The row claims: "run alone at `50b829e4`, `node scripts/test-in-electron.mjs test/daemon.test.ts -t "account"` exited 0 with all eight passed". The eight are the cases that `50b829e4`'s handoff names as failed: "scenario 8 and 9", "keeps the name and the colour `setPane` gave a pane through a change of its account…", "drops the stage a changed pane's session told at the exit…", "refuses with its reason, and ends nothing, a change of a shell…", "drops on a changed pane what the old process's events left…", "starts no process for a change whose account was removed…" and "refuses a change whose pane's process has not ended within the wait…".

What the round found: `-t 'account'` at the target ran eight cases and passed them, but they are not that eight. Vitest matches the filter against the describe name and the case name together. The group is `describe("a Claude Code pane and the owl chain")` (`apps/desktop/test/daemon.test.ts:8460`), whose name holds no "account". Three of the named failures hold no "account" in their own names either: `:8997` ("drops the stage a changed pane's session told…"), `:9133` ("drops on a changed pane what the old process's events left…") and `:9224` ("refuses a change whose pane's process has not ended within the wait…"). The filter skipped all three. In their place it ran the caps group's "refuses to remove an account a queued session would run under…" and two scenario 16 cases (`:8537`, `:8577`), which the handoff does not name. So "all eight passed" counts a different eight, and the row's evidence does not reach three of the cases it rules on.

The conclusion of the row still holds at the target. The wider filter in the fix ran 11 cases at the target, among them each case the handoff names, and each passed (*Probes*). By reading, the work's change to `src/daemon/daemon.ts` (`git show e651d395 -- apps/desktop/src/daemon/daemon.ts`) is the `answersUnknown` field of `ready`, the `default` branch of `Daemon#handle` and `stopCounts`, and none of these is reached by a request those cases send. The sealer reads this row when it weighs the broad gate (`agents/sealer.md` step 1). With the stated command, it would rule on three cases that nobody ran alone.

The search printed one statement of the fact in the work item's records: `frame/plan.md:97`. The search is on the row's words, so it is a sample. The row, rewritten in place:

```markdown
| 2026-11-27 | The eight cases of the account-change group of `daemon.test.ts` that failed at about 5 s each in the broad gate at `0d1b0c8e` are the machine's load, not this work. Run alone at `46066e05`, `node scripts/test-in-electron.mjs test/daemon.test.ts -t "account|changed pane|refuses a change whose pane"` in `apps/desktop` exited 0 with 11 cases passed, the eight among them (`trail/rounds/round-3.md` *Probes*). The filter `-t "account"` alone leaves out three of the eight, whose describe and case names hold no "account". The work changes nothing those cases send or wait for. The broad gate runs again alone. | A case that fails only beside other test runs and passes alone, on a tree that touches none of its requests, fails for time and not for a behaviour. | `seal/config.json` `Broad gate`; the plugin's `agents/sealer.md` step 1 |
```

## Confirmations

What matched: `d7b388bb` pins the keys of `ready` as the daemon sends them at the target. `Daemon#greet` sends `type`, the four lists of `lists()` (`sessions`, `repositories`, `workItems`, `archived`, `apps/desktop/src/daemon/daemon.ts:2945`), `paneKinds`, `headless`, `lastLook`, `keepAwake` only where `holdAwake` is given, `agentNotice`, the three fields of `accountsMessage()` (`accounts`, `defaultAccountId`, `refreshesUsage`, `:2175`), `machine` only where `machineNow()` gives one, and `answersUnknown: true` always (`:997`, read). Sorted, the keys without `keepAwake` and `machine` are the thirteen that both changed lines list (`apps/desktop/test/daemon.test.ts:601`, `:7588`, read). Both cases passed at the target (*Probes*, executed). The second case is the one whose daemon has no `holdAwake`, so its list rightly holds no `keepAwake`. The old lists of twelve keys could not pass against `:997`, since `toEqual` on the sorted keys fails on the added `answersUnknown`; the round read this and did not run the old lists. The commit changes no other line, and no case is added, so no case is owed a red run.

What matched, with a correction to the commit's account: `d7b388bb`'s message says that the merge of the release "had dropped" `answersUnknown` from the two pins. `git log -S'"agentNotice", "answersUnknown"' --all -- apps/desktop/test/daemon.test.ts` printed `d7b388bb` alone (executed), so no earlier commit had the field in either pin. The two pins stand in the base at `57449b14` (`:585`, `:7456`, `git grep` at that commit, executed). The work as one commit, `e651d395`, added the field to `ready` and left both pins as the base had them, and so did the earlier branch at `9215cd24`. The pins were red from `e651d395` on. No round ran them, since rounds 1 and 2 ran `daemon.test.ts` only through `-t` on the groups the work changed. `gaps.md:7` labels the broad gate `unverified` and says the same of phase 2's runs, so the account was honest. A commit message is history and no record, so the wording is no finding.

What matched: the row of `0d1b0c8e` (`frame/plan.md:96`) answers the question that rounds 1 and 2 left in *Not judged*, whether a stop that failed counts as a replacement under *Scope* item 3. Its claims hold at the target (read). `daemonForLoad` adds the build to `replaced` before `stopDaemon` runs (`apps/desktop/src/main/daemon-client.ts:62-63`). Its docstring says a build is added as its stop begins, and that the load rejects with the stop's sentence and starts nothing (`:50-54`). The menu's "Restart Daemon…" stands (`apps/desktop/src/main/main.ts:29`). The row agrees with `trail/phases/phase-1.md`, its first decision, which gives the same grounds. The question is ruled, so this round does not carry it.

What matched: `46066e05` removes `handoff.md`, which `50b829e4` added, and no file of the target names it (`git diff --stat 0f33aba6 46066e05` lists only `daemon.test.ts`, `frame/plan.md` and `trail/rounds/round-2.md`, executed). The handoff held two absolute paths of another Mac. They stand in `50b829e4`'s history only, and the tree at the target holds neither.

What matched: the records read whole state nothing that the range contradicts. `gaps.md:7` still holds the broad gate as `unverified` with the orchestrator as its answerer, which is true at the target. `changelog.md` names no key list of `ready`, and its sentence for a contributor that `ready` gains `answersUnknown: true` (`changelog.md:10`) is what `:997` sends.

When finding 1 is closed and a verifying round leaves nothing open, the broad run of the command in `seal/config.json` `Broad gate` is the orchestrator's, and the sealer's spawn follows it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate: the whole suite, the package's typecheck and the documents' check at the work item's last commit. This round ran three narrow commands, and the suite stays `unverified` | `gaps.md:7` | the orchestrator, at the broad gate |
| The uncommitted row of `frame/plan.md` on the title prefix `feat:`, and the untracked `pr.md`, which stand in the worktree and not at the target | `seal/threads/1795673153-133-an-idle-daemon-of-another-build-is-replaced/frame/plan.md`, `seal/threads/1795673153-133-an-idle-daemon-of-another-build-is-replaced/pr.md` | the next verifying round once they are committed, or the sealer where only records follow the last round |
| A load, and a window, against a daemon of a released build, 0.0.2 to 0.0.4, carried from rounds 1 and 2 | `gaps.md:11`, `gaps.md:12` | the orchestrator, by a walk with a daemon of a released build, or the owner's walk of the release |
| The tab of a pane listed with `workItemId` null, and the seal button, against a daemon of an earlier build, carried from rounds 1 and 2 | `gaps.md:14`, `gaps.md:15` | the answerers those rows name |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t 'carries only the fields the protocol names\|sends no .keepAwake. in .ready.'` in `apps/desktop`, `OWLERY_BACKGROUND=1`, through the machine's lock, at the target | exit 0, 3 passed and 433 skipped: the two pins of `ready`'s keys, and a headless case whose name the first half also matches |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t 'account' --reporter=verbose`, the same environment | exit 0, 8 passed and 428 skipped: the caps group's case of scenario 9, the cases at `:8537`, `:8577`, `:8911`, `:8968`, `:9025`, `:9056` and `:9175`; none of `:8997`, `:9133` and `:9224` ran |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "account\|changed pane\|refuses a change whose pane" --reporter=verbose`, the same environment | exit 0, 11 passed and 425 skipped: the eight above and `:8997`, `:9133`, `:9224` |
