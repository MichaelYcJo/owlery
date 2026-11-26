# Review round 5: 1795610869-217-a-new-work-item-picks-its-branch

```seal
target: 26d1ee05, fixes ce254973..26d1ee05
```

A verifying round of what follows round 4. The range holds five commits:

- `1f8eb5ba`, which applies round 4's finding to the frame, and `e165c756`, its close;
- `b5fd5655`, the row of `frame/plan.md` *Judgments of the run* that files #269;
- `c89a35b7`, the merge of `release/v0.0.5` at `3fb1dedd`, which brings #224 (PR #270);
- `26d1ee05`, the orchestrator's fold of that merge into two rows of the frame.

The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` whole at `26d1ee05`; no `pr.<lang>.md` stands. It reviewed the merge's resolution (`git show --cc c89a35b7`), and #224's side of it (`git diff 783e2331 3fb1dedd -- apps/desktop`) for every reader of a work item's branch #224 adds.

Carried from round 4 and not derived again: the readers the first merge added and how each holds a null branch (`trail/rounds/round-4.md` *Confirmations*). The second merge changes none of `readOwed`, `recordText`, `#commitOwed` or `showRemove` (`git diff b5fd5655 c89a35b7 -- apps/desktop/src/daemon/daemon.ts` names none of them). The tests ran in the branch's worktree, in `apps/desktop`, as the spawn named.

## Findings

None.

## Confirmations

```seal
confirms: round-4#1
```
What holds: `frame/design.md` *The readers of a work item's branch* now holds the two rows round 4 gave, word for word, after the row of `#commitOwed`. Their claims still stand at `26d1ee05`, since the merge of #224 left the three readers as they were. `workItemDirectory` gives null for a null branch (`decision-record.ts:188`), so `readOwed` and `recordText` read nothing, and `renderer.ts#showRemove` still compares `branch` and `ownsBranch` (`renderer.ts:1208-1212`). (read)

What matched: the merge keeps both sides of each conflict, as its message claims. Each item below was read in `git show --cc c89a35b7` and at `26d1ee05`.

- `HeadlessSession` (`daemon.ts:445-451`) drops #224's `asks` and keeps `branch: string | null`. Its comment joins #224's "when the session began" with the branch's "null where it had none yet".
- `InboxLine` (`view.ts:118-121`) keeps the branch's `branchPlace`, `NO_BRANCH` and `branch: string | null`, with #224's comment of `state`, which names no call that waits for the person.
- `lineText`, which #224 rewrote outside the conflicts, still falls back to `workItem.branch ?? NO_BRANCH` (`view.ts:1865`).
- `protocol.ts` drops `answerPermission` and keeps the branch's words for `readSealRecords` of a work item with no branch.
- `daemon.test.ts` drops `permissions` from `WORK_ITEM_FIELDS` and from the creation's expected work item, keeps `ownsBranch`, and turns #224's `ask` messages into `startRoleSession` calls on work items the branch's helpers make.

What matched: `Daemon#startRoleSession` (`daemon.ts:3292`), #224's new way into a role session, holds *Scope* item 3.

- It hands the stored work item to `beginHeadless`, which keeps `branch: item.branch` for the ledger's entry (`daemon.ts:2463`). That is what the ledger's row, folded at `26d1ee05`, says.
- It reads the branch for nothing else. #224's rule of a role's grant, `role-grants.ts#verdictOn`, reads the worktree and no branch.
- No code of `apps/desktop/src` calls it (`grep -rn startRoleSession apps/desktop/src` prints its definition and two comments). The *Overlap* row of `#224` says so too.
- A real case reaches it with no branch. The cases of `daemon.test.ts` *headless sessions* make their work item with `createWorkItem` and no rename (`daemon.test.ts:5584-5597`). So the ledger's entries those cases read back with `branch: workItem.branch` (`daemon.test.ts:6151`, `:6172`) hold `branch: null`, and they pass (see *Probes*). (executed and read)

What matched: the fixture changes repair fixtures and hide no case. The merge gives a branch to `test/chain-run.ts#parkedOnAQuestion` (`chain-run.ts:532`) and to the screenshot scene's shown work item (`screenshots.test.ts:798`).

- Each fixture stores a work item with a chain, parked on a question or stopped at a failed gate. A chain starts only on a branch (`#whyNoChain`), and no path sets a branch back to null once made, so a work item with no branch never holds such a chain.
- The one path #224 reaches through such a fixture is a person's answer, which resumes the parked chain (`daemon.ts:1365`). For a work item with no branch, `answerQuestions` refuses in `#personWrote` before anything is written or resumed. The branch's case "refuses a reversal and an answer for a work item with no branch yet before anything is written, …" pins that refusal (`daemon.test.ts:5026-5035`).
- Without the change, `parkedOnAQuestion` would write a routing naming a null branch, which no real work item holds. So the fixture would hold neither the release's case nor this work's.
- `standing` keeps its `branchless` choice (`chain-run.ts:323`), and the cases of a work item with no branch still take it. (read)

What matched: the six `*-dialog.png` were taken again on #224's scene. `night-watch-light-dialog.png` and `desk-dark-dialog.png` show the form as round 4 read it: "Branch" under "Starts from", with "No branch yet", and the line "No branch yet. The first commit or a rename makes owlery/show-the-seal-on-a-line.". Behind the dialog stands #224's scene: "Rename the settings file" waiting for the machine, "Fix the login redirect" stopped at its failed gate with `owlery/fix-the-login-redirect` in the view's head, and the status line "3 agents of 3, 1 waiting". (read)

What matched: the rows written after round 4 are true at the target.

- `b5fd5655`'s row files round 4's *Not judged* row on `makeBranch`'s hook as #269, which agrees with that row.
- The `#224` row of *Overlap* names `3fb1dedd` and PR #270, and names `startRoleSession` as the one way outside a chain.

One phrase of that row reads loosely: "the two work items #224's tests store without a branch". On #224's side, `createWorktree` still cut a branch. The phrase means the branch those fixtures would lack after the merge, and the rest of the row says so. (read)

Nothing of this round stays open. What comes due is the orchestrator's broad run at `26d1ee05`, and then the sealer's spawn.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether `makeBranch`'s repair from `HEAD@{1}` holds on a git older than 2.54, carried from round 1. | `apps/desktop/src/daemon/worktrees.ts`, `makeBranch` | the orchestrator |
| The suite whole, the typecheck and the built-app files: `machine-dialog.test.ts` and `role-bundle.test.ts` take the changed `parkedOnAQuestion`, and no round ran them. The crafter's logs (`merge-2/run1.txt` to `run4.txt`) do not name their filters, and nothing of the range claims a whole run, so the label `unverified` is honest. | the repository | the orchestrator, by the broad gate |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/view.test.ts test/last-look.test.ts test/chain.test.ts`, in `apps/desktop` | 3 files, 778 cases passed |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "headless sessions"` | 43 cases passed, the two ledger cases at `daemon.test.ts:6151` and `:6172` among them; 365 skipped |
