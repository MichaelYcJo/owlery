# Review round 2: 1795393338-broad-gate-and-sealer

```seal
target: b7621c1 against origin/release/v0.0.2
```

This is a verifying round. The code it reviews is the diff since round 1's target, `00a6963..b7621c1`: `25d7787`, `a7a273a`, `a4c8493`, `b7da1f7`, the close blocks of `c35b710` and the fold `b7621c1`. Beside that bound, the round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and the four phase records whole at `b7621c1`, and every changelog fragment of the release whole, 22 files under `seal/threads/`. No `pr.md` and no `pr.<lang>.md` stand at the target, and the repository declares no `seal/parity.json`.

Carried from round 1, not established again: the clause of `docs/roadmap.md:55` that gives a stale bullet to the work item that makes it untrue, and the check of each operation of `frame/design.md` *Rule changes*. The diff since round 1 changes `frame/design.md` at lines 133, 164 and 291 alone, and none of them is in *Rule changes*. Established in this round: everything else below, with the clause of `docs/product.md:70` read again.

The base. Round 1's *Not judged* row 4 said that the local `release/v0.0.2` at `41e8aa4` runs ahead of the base. It does not: `git merge-base --is-ancestor 41e8aa4 7641741` exits 0, and so does `git merge-base --is-ancestor 7641741 HEAD`. The local ref is stale, and the branch holds the base whole. The row's question is answered and owes nothing.

## Findings

### 1. The verdict block's `built-by:` still names another work item's fix-pass session where a fast-forward or a rebase puts the base's commits on the branch's own line

```seal
severity: should
location: `apps/desktop/src/daemon/worktrees.ts:973-986`, `apps/desktop/src/daemon/daemon.ts:2446-2451`, `apps/desktop/src/daemon/daemon.ts:2484`, `apps/desktop/test/worktrees.test.ts:1055-1094`, `seal/threads/1795393338-broad-gate-and-sealer/changelog.md:13`, `seal/threads/1795393338-broad-gate-and-sealer/gaps.md:65`, `seal/threads/1795393338-broad-gate-and-sealer/frame/design.md:133`, `seal/threads/1795393338-broad-gate-and-sealer/frame/design.md:291`
evidence: executed `test_tmp_trailers_ff.sh` once, in a probe repository with no remote (*Probes*); read `apps/desktop/src/daemon/worktrees.ts:983-986`, `apps/desktop/src/daemon/daemon.ts:2464-2484`, `docs/product.md:70`
reopens: round-1#2
```

Why it matters: the close of round 1's finding 2 holds for a merge commit and not for every merge of the base. Claimed in `changelog.md:13`: "Owlery reads that trailer from the commits of the branch's own line, so a merge of the base branch into the work item's branch names no session of another work item." `trailerValues` now walks `git log --first-parent <baseCommit>..<gate's commit>` (`worktrees.ts:984`). A `git merge` of the base into a branch that holds no commit of its own yet is a fast-forward, and it puts the base's commits on the branch's first-parent line. A rebase of the branch onto its base does the same at any time. The probe showed both. Where the base's line holds another work item's fix-pass commit with its trailers, as GitHub's "Rebase and merge" leaves it, the read printed `s-other s-this` after a fast-forward and after a rebase. After a `--no-ff` merge it printed `s-this` alone, so the fix holds there. `docs/product.md:70` has the seal record name the session that built the work, and the record would name one that built none of it.

The fix pass's `gaps.md:65` records the fast-forward under *Not done* and infers it from git's behaviour. Judged here, it can arise for a work item's branch. A start needs a commit after the base (`daemon.ts:2069-2071`), and the first start commits `routing.md`. So a fast-forward lands only before the person's first commit, for example where the inbox shows the branch behind its base and the person merges it first. A rebase lands at any time. Neither arises in this repository's own history, since its squash commits carry a subject and `Co-authored-by:` alone. It arises in a connected repository whose base keeps the commit messages of what it merges. The memo also names the fast-forward alone and leaves the rebase out.

The fix excludes every commit the base reaches as well as the base commit. The seal's target already names that base (`daemon.ts:2468`), so the read and the target agree on where the branch left its base. Precondition: `^<name>` excludes what the clone's ref holds when the read runs. A commit brought in from a ref the local base branch does not hold yet, such as a remote-tracking branch ahead of it, is still read. The read of `Seal-Routing:` that `gaps.md:65` names closes that case too, and the fix pass weighs which of the two it takes. No path, file mode or encoding is involved.

```ts
/**
 * The values of one trailer in the commits of `to`'s own line that none of
 * `outside` reaches: the commits `git log --first-parent` walks from `to`,
 * less every commit an `outside` name reaches, the oldest commit's first and
 * each value once. With the work item's base commit and the base the seal's
 * target names as `outside`, a commit of the base that a merge, a
 * fast-forward or a rebase put on the branch is none of them, so it adds no
 * other work item's trailer. What git reads as a trailer of that key in a
 * commit's message counts, so a line of a message's first paragraph and a
 * sentence that names the key are none. It throws git's words where a name
 * names no commit.
 */
export async function trailerValues(worktree: string, outside: readonly string[], to: string, key: string): Promise<string[]> {
  const printed = await git(worktree, ["log", "--first-parent", "--reverse", `--format=%(trailers:key=${key},valueonly)`, to, ...outside.map((name) => `^${name}`)], BRANCH_OUTPUT_BYTES);
  return [...new Set(printed.split("\n").map((line) => line.trim()).filter((line) => line !== ""))];
}
```

The call in `Daemon#runSeal` (`daemon.ts:2484`), with `base` as line 2468 resolves it:

```ts
      const passes = baseCommit === null ? [] : (await trailerValues(worktree, [baseCommit, base], step.commit, BUILT_BY_TRAILER)).filter(isSessionId);
```

The case it owes, in `apps/desktop/test/worktrees.test.ts` beside the case at line 1082, with that group's `committer`:

```ts
  it("reads no trailer of a commit of the base that a fast-forward put on the branch's own line", async () => {
    const { repo } = repository();
    const commit = committer(repo);
    const base = commit("a.txt", "chore: the base");
    git(repo, "checkout", "--quiet", "-b", "release");
    commit("o.txt", "fix: another work item's fix pass", "Seal-Routing: 1-other\nSeal-Built-By: s-other");
    git(repo, "checkout", "--quiet", "-");
    git(repo, "merge", "--quiet", "release");
    commit("b.txt", "chore: record the fix pass of round 1", "Seal-Routing: 2-this\nSeal-Built-By: s-this");
    expect(await trailerValues(repo, [base, "release"], git(repo, "rev-parse", "HEAD").trim(), "Seal-Built-By")).toEqual(["s-this"]);
  });
```

The snippets leave these statements of the same fact, and the fix pass owes each. The calls of the two cases at `worktrees.test.ts:1058-1094` take the list in place of `from`. The docstring of `Daemon#runSeal` (`daemon.ts:2446-2451`) says "so none that a merge brought from another branch". The bullet of `changelog.md:13` says the sentence quoted above, and it gains the fast-forward and the rebase. The memo of `gaps.md:65` is rewritten in place to say what still stands. `frame/design.md:133` and `:291` say "the commits `git log --first-parent` walks" between the two names, and they belong to the fold.

```seal
verdict: fixed 15c4513
location: `apps/desktop/test/chain.test.ts`
answer: The finding holds. The precondition was read first. The trailers are read in the work item's worktree, and `Daemon#runSeal` resolves its `base` there before the stage starts: the work item's base branch where `commitNamed` gives its name a commit in that worktree, and the base commit otherwise. So that base is readable where the read runs. The base of the verdict's `target:` line is `Standing.base`, which `chain.ts#roundBase` takes from the name's spelling alone, so it may name a branch that is gone. The read therefore takes the `base` the sealer's diff is read against, as the snippet does. `trailerValues` takes the list as the snippet has it, and its docstring is in the pass's own words and says what is still read. The case is the snippet's with a rebase added. The fix also went to a path the finding does not name: a case of `test/chain.test.ts` holds the daemon's call, on a branch rebased onto a base that holds another work item's fix-pass commit. Each case was shown red by `seal mutate` after the commit. With the base branch left out of the read, which is the old read, the first failed at its fast-forward's assertion with `s-other` before `s-this`. With `[baseCommit]` alone in the call, the chain's case failed with `built-by: the session, s-other, fake-2`. The rebase's assertion of the first case was not shown red apart from the fast-forward's, which fails before it. The bullet of `changelog.md` on the seal record, the memo of `gaps.md` on `built-by:`, `frame/design.md` *Scope* item 16 and its *Data & interfaces* line say the new range. Of the two fixes the record weighs, the pass took the exclusion, which the orchestrator's handoff names, and not the read of `Seal-Routing:`. Two branches stay uncovered and stand in `gaps.md` `## Not done`: a commit taken from a name the base branch does not hold where the read runs, and a base branch that holds the work item's own commits.
```

### 2. `gaps.md` says that this work is no cause of the bullet "Nothing in the app writes or shows a decision or a question yet", and this work's sealer writes both

```seal
severity: should
location: `seal/threads/1795338001-records-place-and-pr-check/changelog.md:17`, `seal/threads/1795393338-broad-gate-and-sealer/gaps.md:45`, `seal/threads/1795393338-broad-gate-and-sealer/frame/design.md:164`
evidence: read `seal/threads/1795338001-records-place-and-pr-check/changelog.md:17`, `seal/threads/1795393338-broad-gate-and-sealer/gaps.md:45`, `apps/desktop/src/daemon/daemon.ts:2410-2417`, `apps/desktop/src/daemon/daemon.ts:2490`, `apps/desktop/src/daemon/daemon.ts:2495`; executed a read of the 22 changelog fragments under `seal/threads/` whole, each with its line numbers
reopens: round-1#3
```

Why it matters: round 1's finding 3 gave this work every bullet of the release that its sealer makes untrue, a bullet with a second cause among them. The fix pass rewrote four and left this one. Claimed at `gaps.md:45`: "Two sentences that other merged work made untrue stand as they were, since this work is no cause of either", and this bullet is the second of them, "untrue since #119". The bullet at `seal/threads/1795338001-records-place-and-pr-check/changelog.md:17` reads "Nothing in the app writes or shows a decision or a question yet." At the target the sealer's `undecided` verdict writes a decision through `Daemon#runRuling` (`daemon.ts:2415`, called at line 2495), or parks a question by `sealer` (`daemon.ts:2417`, and `daemon.ts:2490` past the ceiling). That is the cause `gaps.md:45` itself gives for rewriting the bullet of `seal/threads/1795330500-no-question-holds-the-run/changelog.md`: untrue since #41, "and gained a second cause here". So the memo's statement is false by its own measure, and the release's note keeps a false bullet.

This round read all 22 fragments whole, which is the method that makes the list whole. It found this one bullet beside the four the fix pass rewrote. The other sentence that `gaps.md:45` leaves to other work, "No stage reads it yet" at `seal/threads/1795330500-no-question-holds-the-run/changelog.md:8`, owes nothing here. That sentence is about handing a reversal to a stage. #41's fix pass takes a reversal in, and this work's sealer holds to the decisions that stand `decided` or `applied` (`apps/desktop/role-bundle/agents/sealer.md:52`). The fix pass's keyword search did print this bullet, since it holds "yet" and "#119". So the defect is in the judgment, and the search was not at fault.

The bullet, rewritten in place:

```markdown
- **The app writes and shows a work item's decisions and questions.** This release gives the daemon, Owlery's background process, the code that reads the file and writes each change of it. The stages of "Get a seal" write the decisions and the questions, and the inbox line, the reversal and the answer come with issue #119, which builds on that code.
```

The memo of `gaps.md:45`, rewritten in place:

```markdown
This work rewrote five bullets of earlier changelog fragments of the release that its gate and its sealer make untrue, as `docs/roadmap.md` *Releases and the tracker* asks. Three had been untrue since #41 or #119 merged and gained a second cause here, since the sealer's question is decided or parked in `decisions.md`: the bullet of `seal/threads/1795330500-no-question-holds-the-run/changelog.md` that opened "Nothing in this release makes a decision or holds a work item yet", the last two sentences of the bullet on starting a role in `seal/threads/1795329620-role-bundle/changelog.md`, and the bullet "Nothing in the app writes or shows a decision or a question yet" of `seal/threads/1795338001-records-place-and-pr-check/changelog.md`. The fourth is the sentence "No stage launches a role session yet" of `seal/threads/1795338000-role-tools-and-permissions/changelog.md`, of the same two causes. The fifth is the words "which no stage writes yet (issue #42)" of `seal/threads/1795341001-cost-per-stage/changelog.md`, which this work alone made untrue. One sentence that #41 made untrue stands as it was, since this work is no cause of it: "No stage reads it yet: handing a reversal to the next stage comes with the review rounds (#41)" of `seal/threads/1795330500-no-question-holds-the-run/changelog.md`. The sealer holds to the decisions that stand `decided` or `applied`, and the fix pass takes a reversal in. Review round 2 read every fragment of the release whole and found no other.
```

The snippets leave one statement of the same fact. `frame/design.md:164`, *Scope* item 29 as `b7621c1` folded it, names four fragments, and the fold owes it the fifth, `seal/threads/1795338001-records-place-and-pr-check/changelog.md`, on nothing in the app writing a decision or a question.

```seal
verdict: fixed ec508ee
answer: The finding holds. The bullet is rewritten in place, in the pass's own words. The snippet's last sentence kept "come with issue #119" for the inbox line, the reversal and the answer, which reads as work still to come, and #119 is merged in this release. The bullet now says that #119 builds those three on the daemon's code and that the stages of "Get a seal" write the decisions and the questions. The memo of `gaps.md` is rewritten in place, in the pass's own words as well: it names the five bullets, what this pass made true beside them under finding 3, and the three statements that stand as they were. `frame/design.md` *Scope* item 29 names the fifth fragment.
```

### 3. Two sentences the fix pass wrote into earlier fragments leave out the orchestrator's judgments that "Get a seal" runs

```seal
severity: should
location: `seal/threads/1795330500-no-question-holds-the-run/changelog.md:15`, `seal/threads/1795338000-role-tools-and-permissions/changelog.md:7`
evidence: read `apps/desktop/src/daemon/daemon.ts:2384`, `apps/desktop/src/renderer/view.ts:319`, `apps/desktop/src/shared/protocol.ts:433-438`, `apps/desktop/src/daemon/role-grants.ts:35`, `seal/threads/1795330500-no-question-holds-the-run/frame/plan.md:85`
regression: round-1#3
```

Why it matters: the unit is the two sentences that `a7a273a` wrote in its own words. `frame/design.md` *Scope* item 29 gives the crafter the bullet "on what decides and parks without a person" and the one "on no stage launching a role session". The fix rewrote each, and each new sentence names the stages without the orchestrator's place in them. A person reads both in the release's note.

- `seal/threads/1795330500-no-question-holds-the-run/changelog.md:15` ends: "The choice of a route records no decision yet (#51)." At the target every judgment of convergence is recorded as a decision of the kind `route` (`daemon.ts:2384`), and the window lists that kind as "Route" (`view.ts:319`). The sentence has two readings, and the one a person meets in the window is false: decisions listed as "Route" do stand in this release. #51 is the depth judgment of release 0.0.3, which records the route it chose (`seal/threads/1795330500-no-question-holds-the-run/frame/plan.md:85`).
- `seal/threads/1795338000-role-tools-and-permissions/changelog.md:7` ends: "The stages of "Get a seal" launch the role sessions: a proofer at each review round, a crafter at each fix pass and a sealer at the verdict." The orchestrator at `judgment` is a role session too (`protocol.ts:437`), with a grant of its own (`role-grants.ts:35`). The stages launch it for each judgment of convergence and each ruling. The list reads as whole, and it leaves the orchestrator out.

The sentence of `changelog.md:15`, replaced in place:

```markdown
The judgment whether the review rounds are converging is listed with the kind "Route". The route chosen for a work item before its first edit records no decision yet (#51).
```

The last sentence of `changelog.md:7`, replaced in place:

```markdown
The stages of "Get a seal" launch the role sessions: a proofer at each review round, a crafter at each fix pass, a sealer at the verdict, and the orchestrator at each judgment of whether the rounds are converging and at each ruling on a stage's question.
```

The snippet for `changelog.md:7` stops at that sentence. The sentence before it, "It refuses each command of a proofer and of a sealer that asks for permission", names no orchestrator either, whose grant runs nothing. That omission dates from #41, which added the role, and *Not judged* holds it.

```seal
verdict: fixed ec508ee
location: `seal/threads/1795329620-role-bundle/changelog.md`, `seal/threads/1795393338-broad-gate-and-sealer/gaps.md`
answer: The finding holds. The sentence on the route takes the replacement, with "is listed as" for "is listed with the kind". The last sentence of the role tools' bullet takes the replacement as given. On the orchestrator's word, the same commit also makes true what the bullets under rewrite said of the roles, which *Not judged* names and this work is no cause of. The role tools' bullet names the orchestrator among the roles whose commands that ask are refused (`role-grants.ts#GRANTS`). The two bullets of `seal/threads/1795329620-role-bundle/changelog.md` that said three roles say four, name the orchestrator and what it judges, and say that its definition came with #41. That fragment is a path the finding does not name, and so is the memo of `gaps.md`, which names these rewrites. Two statements of the same kind stand in bullets the pass did not rewrite, and `gaps.md` names each: the role bundle's bullet for a client of the daemon, which lists three pairs an `ask` takes, and the role tools' bullet on a role's tools, which names no orchestrator.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: the memo at `gaps.md:63` reads, word for word, the text round 1 gave, and it stays under `## Not done`. `frame/design.md:342-381` holds the six `change` operations it names at `b7621c1`, unchanged since `00a6963`. Read.

What matched: the part of round 1's finding 2 that its symptom named. `trailerValues` reads with `--first-parent` (`worktrees.ts:984`), and `b7da1f7` changes the spaces of that line alone. Executed: `test/worktrees.test.ts` through the lock passed 83 of 83. The new case at line 1082 is red against the old read. In the probe, the case's own sequence of commits printed `s-other s-this s-later` without `--first-parent` and `s-this s-later` with it, so `s-other` first, as the close says. The case covers the read past a merge, which the group's first case does not.

What matched: the bullets the fix pass rewrote of `seal/threads/1795329620-role-bundle/changelog.md:7` and `seal/threads/1795341001-cost-per-stage/changelog.md:13`. The daemon enters a gate's run with `usage: null` (`daemon.ts:2566`). The other sentences of `seal/threads/1795330500-no-question-holds-the-run/changelog.md:15` hold. The ceiling gives a ruling to the first two `undecided` verdicts (`daemon.ts:2473`, `chain.ts:48`) and parks the third, and the first start commits `routing.md` (`daemon.ts:2172-2199`). Read.

What matched: `frame/design.md` *Scope* item 16 and *Data & interfaces* at lines 133 and 291 say what the code does at the target. The fold at `b7621c1` names the four fragments that the diff rewrote. Read.

What matched: the label of the broad gate. The new row of `gaps.md` names the fix pass's narrow runs and leaves the whole suite and the typecheck to the orchestrator's broad gate, so the `unverified` label is honest. This round ran one test file. With the three findings above closed and read by a round, what comes due is the orchestrator's broad run, and the sealer's spawn after it.

The new cases of the branch against their groups. The branch adds 126 cases in 13 test files. This round read the names of 120 of them, in `chain`, `seal-records`, `gate`, `view`, `worktrees`, `pr-check`, `claude-adapter`, `repositories` and `last-look`, against the names of the cases beside them. No two name the same fact at the same level. Where a daemon case and a unit case name one fact, such as the cut of the kept output in `test/chain.test.ts` and in `test/gate.test.ts`, the frame's scenarios name both levels. A reading by names is a sample, and *Not judged* holds the bodies.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The bodies of the 126 new cases, read against their groups for a case that covers nothing its group does not. This round read the names of 120 of them, and none of the six in `role-bundle`, `record-blocks`, `fake-adapter` and `daemon` | `apps/desktop/test/` | The orchestrator, who decides whether a later round reads them |
| `seal/threads/1795329620-role-bundle/changelog.md:5` and the first sentence of line 7 say that the bundle holds three roles. It holds four definitions since #41 added `apps/desktop/role-bundle/agents/orchestrator.md` in `71d035e`. The sentence of `seal/threads/1795338000-role-tools-and-permissions/changelog.md:7` on the commands that are refused names no orchestrator either. This work is no cause of these sentences, so the round opens no finding | `seal/threads/1795329620-role-bundle/changelog.md:5`, `seal/threads/1795338000-role-tools-and-permissions/changelog.md:7` | The orchestrator, before the release's note is built |
| The whole suite, the typecheck and the broad gate at the target | the tree at `b7621c1` | The orchestrator's broad gate |

## Probes

| Command | Result |
|---|---|
| `git merge-base --is-ancestor 41e8aa4 7641741`, then `git merge-base --is-ancestor 7641741 HEAD` | Both exited 0 |
| `git log --format='%h %(trailers:key=Seal-Built-By,valueonly,separator=%x2C)' --all`, keeping the lines that hold a value | Printed nothing: no commit of the repository carries `Seal-Built-By:` |
| `test_tmp_trailers_ff.sh`, run once in a probe repository under the round's scratch directory, which no remote holds. The base's line holds another work item's fix-pass commit with `Seal-Routing:` and `Seal-Built-By: s-other`. Three branches cut before it then take the base by a fast-forward, by a rebase and by a `--no-ff` merge, and a fourth replays the new case of `test/worktrees.test.ts` | Exit 0. The fast-forward and the rebase printed `s-other s-this` for `git log --first-parent B0..HEAD`, and `s-this` for `git log --first-parent HEAD ^B0 ^main`. The `--no-ff` merge printed `s-this` with `--first-parent` and `s-other s-this` without it. The replayed case printed `s-other s-this s-later` without `--first-parent` and `s-this s-later` with it (finding 1, and the red of the new case under *Confirmations*) |
| `node scripts/test-in-electron.mjs test/worktrees.test.ts` in `apps/desktop`, through the lock | Exit 0, 83 cases passed |
