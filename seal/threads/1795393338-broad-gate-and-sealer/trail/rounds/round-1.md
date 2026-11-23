# Review round 1: 1795393338-broad-gate-and-sealer

```seal
target: 00a6963 against origin/release/v0.0.2
```

The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and the four phase records whole at `00a6963`, and the diff of the branch against `7641741`, which is the merge base. No earlier round stands, so no fact was carried from one, and every fact below was established in this round. No `pr.md` and no `pr.<lang>.md` stand at the target. The repository declares no `seal/parity.json`.

## Findings

### 1. `gaps.md` says that no operation of the frame's *Rule changes* rewrites three statements of `docs/design.md`, and the folded frame holds an operation for each

```seal
severity: should
location: `seal/threads/1795393338-broad-gate-and-sealer/gaps.md:62`
evidence: read `seal/threads/1795393338-broad-gate-and-sealer/gaps.md:62`, `seal/threads/1795393338-broad-gate-and-sealer/frame/design.md:342-381`; executed `git show 00a6963 -- seal/threads/1795393338-broad-gate-and-sealer/frame/design.md`, which adds the six `change` operations
```

Why it matters: the closing memo is what the sealer and the settle read as the work's account of what it left. Its last paragraph reads: "Three statements of `docs/design.md` and of its Korean edition are untrue at this work's head, and no operation of `frame/design.md` *Rule changes* rewrites them." The fold `00a6963` added six `change` operations to *Rule changes* (`frame/design.md:342-381`), one for each of the three statements and one for each Korean twin. This round checked each operation's `from` against the document it names: each section heading stands once, and each `from` stands in its file with runs of white space collapsed. So at the target the memo states a gap that the frame has closed, and a reader who acts on it asks the settle for an operation that already stands.

The paragraph is a memo of `## Not done`, so it is rewritten in place and not taken out (`skills/code-review/SKILL.md` *What the diff removes from a closing memo*). `trail/phases/phase-4.md` states the same fact at that phase's head, and it stays as it is, since a phase record holds what the phase found when it was written.

```markdown
Three statements of `docs/design.md` and of its Korean edition were untrue at phase 4's head: the notes of the approval line, the paragraph on the lit seal, and the paragraph on the screenshot run. `trail/phases/phase-4.md` names each. The fold at `00a6963` wrote a `change` operation for each, and one for its Korean twin, into `frame/design.md` *Rule changes*, so the settle rewrites them.
```

```seal
verdict: fixed a7a273a
answer: The finding holds: `frame/design.md` *Rule changes* holds a `change` operation for each of the three statements and for each Korean twin. The memo of `gaps.md` is rewritten in place with the text above, and it stays under `## Not done`.
```

### 2. The verdict block's `built-by:` names the fix-pass sessions of other work items once the base branch is merged into this branch

```seal
severity: should
location: `apps/desktop/src/daemon/worktrees.ts:973-983`, `apps/desktop/src/daemon/daemon.ts:2446-2450`, `apps/desktop/src/daemon/daemon.ts:2483`, `apps/desktop/test/worktrees.test.ts:1055-1078`, `seal/threads/1795393338-broad-gate-and-sealer/frame/design.md:133`, `seal/threads/1795393338-broad-gate-and-sealer/frame/design.md:291`
evidence: executed a probe repository: two branches cut at one base, each with a fix-pass commit that carries `Seal-Built-By:`, the second merged into `main` with `git merge --no-ff`, and `main` merged into the first; then `git log --reverse "--format=%(trailers:key=Seal-Built-By,valueonly)" <base>..<head>`, the read of `worktrees.ts#trailerValues`, printed `a-crafter` and `b-crafter`, and the same read with `--first-parent` printed `b-crafter` alone; read `apps/desktop/src/daemon/worktrees.ts:980-983`, `apps/desktop/src/daemon/daemon.ts:2483`
```

Why it matters: `Daemon#runSeal` reads the sessions that built the work as `trailerValues(worktree, baseCommit, step.commit, BUILT_BY_TRAILER)` (`daemon.ts:2483`). That function runs `git log <from>..<to>` (`worktrees.ts:981`), which walks every parent of a merge. A merge of the base branch into the work item's branch brings in every commit the base gained since the branch was cut. Where another work item reached the base by a merge commit, its fix-pass commits carry their own `Seal-Built-By:` trailers, and the read returns those ids too. The verdict block then names, as builders of this work, sessions that built none of it. `docs/product.md` *The seal belongs to the product and looks the same everywhere* has the seal record name the session that built the work, and the record would say something false. Merging the release branch into a built branch is this repository's own practice, and `98e4414` on this branch is one such merge.

Claimed: `frame/design.md` *Scope* item 16 (line 133) reads the ids "from the trailer `Seal-Built-By:` of the commits between the work item's `baseCommit` and the gate's commit", and the build follows it to the letter. The defect is in that sentence as much as in the code, so the fix reaches the frame's two statements as well (line 133, and *Data & interfaces* at line 291). The case at `worktrees.test.ts:1055-1078` builds a straight line of commits, so it cannot tell the two reads apart.

Precondition of the fix: the daemon makes each fix pass's record commit on the work item's branch, in its worktree (`Daemon#chainCommit`), so that commit stands on the branch's first-parent line. A merge made on the branch keeps the branch as the first parent, with `git merge` and with GitHub's "Update branch" alike. A fix-pass commit that reached the branch only through a merge from another line is then not read. No path, file mode or encoding is involved.

```ts
/**
 * The values of one trailer in the commits of `to`'s own line after `from`:
 * the commits `git log --first-parent` walks from `to` back to `from`, the
 * oldest commit's first and each value once. A commit that a merge brought
 * onto the line from another branch is none of them, so a merge of the base
 * into a work item's branch adds no other work item's trailer. What git
 * reads as a trailer of that key in a commit's message counts, so a line of
 * a message's first paragraph and a sentence that names the key are none.
 * It throws git's words where either names no commit.
 */
export async function trailerValues(worktree: string, from: string, to: string, key: string): Promise<string[]> {
  const printed = await git(worktree, ["log", "--first-parent", "--reverse", `--format=%(trailers:key=${key},valueonly)`, `${from}..${to}`], BRANCH_OUTPUT_BYTES);
  return [...new Set(printed.split("\n").map((line) => line.trim()).filter((line) => line !== ""))];
}
```

The case it owes, in `apps/desktop/test/worktrees.test.ts` beside the case at line 1056, with that case's helpers:

```ts
  it("reads no trailer of a commit that a merge brought onto the branch from another line", async () => {
    const { repo } = repository();
    const commit = (file: string, ...message: string[]): string => {
      writeFileSync(join(repo, file), `${file}\n`);
      git(repo, "add", file);
      git(repo, "commit", "--quiet", ...message.flatMap((paragraph) => ["-m", paragraph]));
      return git(repo, "rev-parse", "HEAD").trim();
    };
    const base = commit("a.txt", "chore: the base");
    git(repo, "checkout", "--quiet", "-b", "other");
    commit("o.txt", "chore: record the fix pass of round 1", "Seal-Routing: 1-other\nSeal-Built-By: s-other");
    git(repo, "checkout", "--quiet", "-");
    commit("b.txt", "chore: record the fix pass of round 1", "Seal-Routing: 2-this\nSeal-Built-By: s-this");
    git(repo, "merge", "--quiet", "--no-ff", "-m", "merge the other line", "other");
    expect(await trailerValues(repo, base, git(repo, "rev-parse", "HEAD").trim(), "Seal-Built-By")).toEqual(["s-this"]);
  });
```

The snippet leaves three statements of the same fact, and the fix pass owes each. The first is the docstring of `Daemon#runSeal` (`daemon.ts:2446-2450`), which reads "of the commits between the work item's base commit and the gate's commit" and gains "on the branch's own line". The other two are `frame/design.md:133` and `:291`, which say the same and belong to the fold.

```seal
verdict: fixed 25d7787
location: `seal/threads/1795393338-broad-gate-and-sealer/changelog.md`
answer: The finding holds, and its precondition was read: `Daemon#chainCommit` commits through `worktrees.ts#commitPaths`, which refuses a worktree that is not on the work item's branch, so a fix pass's commit stands on the branch's own line. `trailerValues` reads with `--first-parent` as the snippet has it, and the docstring of `Daemon#runSeal`, `frame/design.md` *Scope* item 16 and its *Data & interfaces* line say the same. The case is the snippet's with one more fix-pass commit after the merge, so it also holds that the read goes on past a merge. It failed on the old read with `s-other` first among the values, and `seal mutate` without `--first-parent` read red on it. The fix also went to a path the finding does not name: the bullet of this work's `changelog.md` on the seal record gains the sentence on the branch's own line. `b7da1f7` puts back a space the fix's commit lost after a comma of that line. One branch stays uncovered and stands in `gaps.md` `## Not done`, committed in `a7a273a`: a branch fast-forwarded over the base's commits holds them on its own line, and a trailer among them is read.
```

### 3. The role bundle's changelog still says that the final verdict comes with a later issue, which this work ships, and `gaps.md` gives that bullet to #41 alone

```seal
severity: should
location: `seal/threads/1795329620-role-bundle/changelog.md:7`, `seal/threads/1795330500-no-question-holds-the-run/changelog.md:15`, `seal/threads/1795393338-broad-gate-and-sealer/gaps.md:44`
evidence: read `seal/threads/1795329620-role-bundle/changelog.md:7`, `seal/threads/1795330500-no-question-holds-the-run/changelog.md:15`, `docs/roadmap.md:55`, `seal/threads/1795393338-broad-gate-and-sealer/gaps.md:44`, `seal/threads/1795393338-broad-gate-and-sealer/trail/phases/phase-4.md:312`
```

Why it matters: `docs/roadmap.md:55` reads: "A work item that makes a bullet of an earlier changelog fragment of the same release untrue rewrites that bullet in its own pull request." The bullet at `seal/threads/1795329620-role-bundle/changelog.md:7` ends: "The window has no control that starts a role yet. The review rounds, the fix passes and the final verdict that use the roles come with later issues." At the base `7641741` #41 had shipped the rounds and the fix passes, and no sealer ran, so the words on the final verdict still held. This work ships the sealer's verdict in the same release, so it makes that part of the bullet untrue, and the roadmap gives the rewrite to this work.

Claimed: `gaps.md:44` names the bullet's sentence "The window has no control that starts a role yet" and gives both stale bullets to #41: "that was #41 for both". `trail/phases/phase-4.md:312` says that its search over the fragments for "sealer" and "verdict" printed "two that #41 made untrue". That search printed this line, which holds "the final verdict", and the account read only #41's sentence in it. The other bullet, `seal/threads/1795330500-no-question-holds-the-run/changelog.md:15`, reads "Nothing in this release makes a decision or holds a work item yet", and its next sentence names "the gate and the sealer (#41, #42)" among the stages that ask. #41 made it untrue first. This work's sealer makes a ruling and parks a work item as well, so it is a second cause, and one pull request that rewrites both bullets leaves no false bullet in the release's note.

```markdown
- **Owlery's background process, the daemon, can start a session as one of the three roles.** It gives your `claude` the bundle for that session alone, picks the role's definition, and appends the role's rules to the session's system prompt. "Get a seal" in a work item's view starts the review rounds, the fix passes and the sealer's verdict, each a session of its role.
```

The fix pass keeps the bullet's first two sentences as they stand, and the replacement above changes only its last two. The bullet of `seal/threads/1795330500-no-question-holds-the-run/changelog.md:15` is rewritten to say which stages of this release make a decision or park a work item: the rounds, the fix passes, the convergence judgment and the sealer's `undecided` verdict. Its last sentence on a work item with no directory goes as well, since the chain's first start makes the directory. `gaps.md:44` is rewritten in place to say that this work rewrote both bullets, and the paragraph stays.

```seal
verdict: fixed a7a273a
location: `seal/threads/1795338000-role-tools-and-permissions/changelog.md`, `seal/threads/1795341001-cost-per-stage/changelog.md`
answer: The finding holds. The role bundle's bullet takes the replacement above. The bullet of the fragment on questions is written in the pass's own words: it names the orchestrator's decisions on convergence, on a round's or a fix pass's question and on a sealer's `undecided` verdict, what holds a work item, the route's choice as not yet deciding (#51), and the first start of "Get a seal" as what makes the directory. The fix also went to two paths the finding does not name, since the same cause made a sentence of each untrue: "No stage launches a role session yet" of the role tools' fragment, and "which no stage writes yet (issue #42)" of the ledger's fragment, which this work alone made untrue. The memo of `gaps.md` is rewritten in place: it names the four rewrites, and the two sentences of earlier fragments that #41 and #119 made untrue and this work is no cause of, which stand as they were. The search behind that list read the fragments' sentences that hold "yet", "later", "comes with" or an issue's number, and read no fragment whole.
```

## Confirmations

What matched: *Scope* item 1 and its table. `chain.ts#stepOwed` reads the gate's row after #41's rows and the seal's row after it, and `gateHolds` compares two trees through `worktrees.ts#pathsBetween` (`git diff --name-only --no-renames`), so a merge or a decision's commit after the gate's commit owes the gate again. Read: `apps/desktop/src/daemon/chain.ts:230-282`, `apps/desktop/src/daemon/worktrees.ts:985-994`.

What matched: *Scope* items 4 to 12. `Daemon#whyNoChain` refuses a start whose `Broad gate` key holds no command, or white space alone. `gate.ts#startGate` hands the whole line to `/bin/sh -c` with the null device as input, two pipes and a process group of its own. `Daemon#runGate` checks the head and the tree before and after the run, builds the record on the file as the head holds it, and keeps the output in `gate-output/<id>.txt`, written with mode `0600` through `whole-file.ts#writeWholeFile`. It also enters the run in the ledger with no usage. Read: `apps/desktop/src/daemon/gate.ts:37-149`, `apps/desktop/src/daemon/daemon.ts:2059-2061`, `apps/desktop/src/daemon/daemon.ts:2530-2596`.

What matched: *Scope* items 13 to 16. The seal stage's conditions are the nine that item 14 lists, and `UNDECIDED_CEILING` is 2, the default of `frame/questions.md` Q1. `GATE_LIMIT_MS` is 60 minutes, the default of Q2. The section's form holds to items 13, 14 and 23, the default of Q3. The build holds every default the frame names for Q1 to Q3, and this round settles none of the three. Read: `apps/desktop/src/daemon/daemon.ts:2461-2497`, `apps/desktop/src/daemon/chain.ts:48`, `apps/desktop/src/daemon/gate.ts:12`, `apps/desktop/src/daemon/seal-records.ts:186-245`.

What matched: *Scope* items 18 to 21 in `pr-check/`. The four keys of the verdict block in `pr-check/lib/fields.py` are spelt as in `record-blocks.ts`, each held at most once. `CLOSING_RECORDS` gains `trail/refusals.md`. The refusal of a judge that built compares whole names after a split at `, `. Read: `pr-check/lib/fields.py:90-108`, `pr-check/lib/fields.py:228-252`, `pr-check/skills/code-review/scripts/chain_check.py:183-189`, `pr-check/skills/code-review/scripts/chain_check.py:1787-1792`.

What matched: the searches of scenario 17, scenario 24 and the first row of `## Removes`. Scenario 17's search printed nothing and exited 1. Scenario 24's search printed nothing and exited 1. The `## Removes` search printed the five lines of `chain.ts` that the row names, 958, 961, 964, 977 and 994. All three were executed at the target, and *Probes* lists each.

What matched: the six screenshots under `screenshots/`. Each shows the parked work item's view with the gate's line first under "Ask": the finished mark of its theme, the words "Broad gate", the command `sh scripts/check.sh` in the fixed-width face, the word "finished" and "Show output", as the `add` operation for *A pull request that changes the window carries its screenshots* (`frame/design.md:333-336`) states. This answers the `gaps.md` row that leaves four of the six unopened to the review. Read: all six files.

What matched: the rewritten bullets of `seal/threads/1795388700-review-rounds/changelog.md` and `seal/threads/1795342001-progress-through-roles/changelog.md` say what the target does. Read: the diff of both files against the base.

What matched: the label of the broad gate. Each phase record names the narrow set it ran and leaves the whole suite and the typecheck to the orchestrator's broad gate, and `gaps.md` names the same answerer, so the `unverified` label is honest. This round ran no test file. With nothing of this round left open after the fix pass and the next round, what comes due is the orchestrator's broad run, and the sealer's spawn after it.

A case without a frame fact: none was found among the cases whose names this round read. The read was a sample, as `## Not judged` says.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Each new case read against the cases of its group, for a case that covers nothing its group does not. This round read the case names of `test/chain.test.ts` (the order, the broad gate and the seal), `test/gate.test.ts` and `test/seal-records.test.ts`, and three of those cases whole, and did not read the other new cases of `test/chain.test.ts`, `test/view.test.ts`, `test/pr-check.test.ts` and `test/get-a-seal.test.ts` whole | `apps/desktop/test/` | Round 2 |
| The phase records' `seen red` and mutation claims. This round read them as claims and ran none of them | `seal/threads/1795393338-broad-gate-and-sealer/trail/phases/` | The sealer, which reads them by its definition |
| `apps/desktop/role-bundle/agents/sealer.md` *Job* sends the sealer to `skills/verify/SKILL.md` *The hand-back's labels carry the claims, and the one seal is the sealer's*. That section says that the sealer's `seal stamp --guarantee` writes the stamp's values, and the file's head says the sealer opens it for conditions that run a command. `role-bundle/README.md` declares that the taken documents still name `seal` commands, so the round did not count it as a finding. Whether a real sealer tries the command, and spends a refused call on it, is not shown by any case | `apps/desktop/role-bundle/skills/verify/SKILL.md:15-19`, `apps/desktop/role-bundle/skills/verify/SKILL.md:116-122` | The first real chain on a branch of Owlery's own (`frame/questions.md` Q3) |
| Whether the branch still merges cleanly with the release branch. The local `release/v0.0.2` stands at `41e8aa4`, after this target's base `7641741`, and its newer commits change the daemon (#158 and #159) | the branch against `release/v0.0.2` | The orchestrator |
| The whole suite, the typecheck and the broad gate at the target | the tree at `00a6963` | The orchestrator's broad gate |

## Probes

| Command | Result |
|---|---|
| `git grep -n -e 'session_id' -- apps/desktop/src ':!apps/desktop/src/daemon/adapters/claude.ts'` at `00a6963` | Printed nothing, exit 1 |
| The search of scenario 24, `git grep -n -e 'seal gate' -e 'seal pr-body' -e 'broad_gate' -e 'chain_check' -e 'Claims re-run' -e 'lib/fields.py'` over the sealer's three texts, at `00a6963` | Printed nothing, exit 1 |
| `git grep -n -e '"reviewed"' -e 'reviewedAt' -- apps/desktop/src` at `00a6963` | Five lines of `apps/desktop/src/daemon/chain.ts`, at 958, 961, 964, 977 and 994 |
| A Python read of each operation of `frame/design.md` *Rule changes*: its `section:` against the headings of the file it names, and its `from` against that file with white space collapsed | Each of the 14 operations names a heading that stands once, and each of the 8 `from` texts stands in its file |
| `test_tmp_trailers.sh`, run once in a probe repository under the round's scratch directory, which no remote holds: two branches cut at one base, each with a fix-pass commit carrying `Seal-Built-By:`, one merged into `main` with `--no-ff` and `main` then merged into the other; the read of `trailerValues`, then the same read with `--first-parent` | Exit 0. The first read printed `a-crafter` and `b-crafter`, and the read with `--first-parent` printed `b-crafter` alone (finding 2) |
