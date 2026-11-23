# Review round 2: 1795395059-pull-request-and-seal-check

```seal
target: e7d94d9, fixes 0359ff6..e7d94d9
```

This is a verifying round. Its code is the diff of the fixes after round 1's record (`0359ff6`): `742ba93` (the orchestrator's repair of `pr.md`), `c06a583` (the framer's fold of findings 1 to 4 and 8), `e84ade6` to `6dc7679` (the crafter's fix pass) and `e7d94d9` (the close blocks). The work item's records that state the present were read whole at `e7d94d9`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. `pr.<lang>.md` does not stand, since `Commit and pull request language` is English. The tree holds no `seal/parity.json`, so no parity comparison was owed. The round worked in a `git clone --no-local` of the worktree at `e7d94d9`, under the round's scratch directory, and its narrow runs went through `apps/desktop/scripts/test-in-electron.mjs`.

Carried from round 1, and not established again: that `daemon.ts#runPullRequest` is the one caller of the push and of `gh pr create` and `gh pr edit` (the fix diff adds no call site); round 1's reading of the six guards of the watch and of the arms of `github.ts` that no case reaches; and its four rows of `## Not judged`, which stand as round 1 left them. Re-established here: `chain_check.py#outcome` against `pr.md` and the READMEs, read at `pr-check/skills/code-review/scripts/chain_check.py:2454-2477`.

## Findings

### 1. No case watches which commit the stage hands the push: a mutant that pushes the branch's name passes every case of the stage

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:2694`, `apps/desktop/test/chain.test.ts`, `seal/threads/1795395059-pull-request-and-seal-check/gaps.md:27`
evidence: executed `node scripts/test-in-electron.mjs test/chain.test.ts -t "the pull request stage of a work item's chain"` against the mutant `pushBranch(cli, target.remote, branch, branch)` (9 passed), and `node scripts/test-in-electron.mjs test/test_tmp_round2_push.test.ts` against the mutant (red at its line 26) and against `e7d94d9` (green); read `apps/desktop/src/daemon/daemon.ts:2689-2694`, `apps/desktop/src/daemon/daemon.ts:2715`
regression: round-1#1
```

Why it matters: the unit is `daemon.ts#runPullRequest`, whose call of `pushBranch` the fix pass changed at `e84ade6`. Read at the target, the call holds: the stage reads the head at `daemon.ts:2689`, stops where it moved at `:2690`, pushes that head by its id at `:2694` and stores it as `pushed` at `:2715`. So round 1's finding 1 is closed in the code. What holds it is one argument of one call, and no case reads that argument. The fix pass says so itself in `gaps.md:27`, handed to "The review rounds, by reading the call". This round ran the mutant that `gaps.md:27` names: with `pushBranch(cli, target.remote, branch, branch)` the nine cases of the stage in `test/chain.test.ts` passed. The case of scenario 6 in `test/pull-request.test.ts:109` holds `pushBranch` alone and cannot see what the daemon passes it. A later edit that hands the call the branch's name again, or the work item's `branch` where `head` was meant, puts back the defect of round 1's finding 1, which is the fourth invariant, and the suite stays green.

The frame places the fact at the stage and the case at the unit. *Scope* item 4 says the daemon pushes "the whole id of that head", the head the stage read. Scenario 6 and round 1's paste-ready fix put the one owed case in `test/pull-request.test.ts`, on `pushBranch` alone. The fix pass built that case, and so the call between the stage's check and `pushBranch` was left with no case. That is where the gap came from.

A chain case can make the race happen on purpose. The push runs with the stage's environment (`cli.env`, from `gateEnv`), so a `git` placed first on that `PATH` can make a commit in the worktree just before it pushes. Under the mutant this case failed at the assertion on the remote's branch, which held the later commit. On `e7d94d9` it passed. It goes in the `describe` "the pull request stage of a work item's chain" of `apps/desktop/test/chain.test.ts`, which already imports `mkdtempSync`, `rmSync`, `writeFileSync`, `tmpdir` and `join`.

```ts
// At the top of test/chain.test.ts:
import { execFileSync } from "node:child_process";

// In the describe "the pull request stage of a work item's chain":
  it("pushes the head the stage checked, by its id, and not a commit that lands on the branch between the check and the push", async () => {
    // A git first on the stage's PATH that commits in the worktree just before it pushes, as a person's terminal could.
    const shims = mkdtempSync(join(tmpdir(), "owlery-git-shim-"));
    cleanups.push(() => rmSync(shims, { recursive: true, force: true }));
    const real = execFileSync("/bin/sh", ["-c", "command -v git"], { encoding: "utf8" }).trim();
    writeFileSync(join(shims, "git"), `#!/bin/sh\nif [ "$1" = push ]; then "${real}" commit --quiet --allow-empty -m "feat: a commit after the check"; fi\nexec "${real}" "$@"\n`, { mode: 0o755 });
    const { c, workItems, remote } = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ proofer: clean }), gateEnv: { PATH: `${shims}:${process.env.PATH ?? "/usr/bin:/bin"}` } });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.chain(a.id, "sealed");
    expect(commitsAfterMain(a.worktree).map(({ subject }) => subject).slice(-2)).toEqual(["chore: record the sealer's verdict", "feat: a commit after the check"]);
    const checked = git(a.worktree, "rev-parse", "HEAD~1").trim();
    expect(branchesOf(remote)).toEqual([`${a.branch} ${checked}`]);
    expect(c.workItem(a.id)?.pullRequest?.pushed).toBe(checked);
  });
```

The fix pass owes `gaps.md:27` too: the row is answered once the case stands, and it is closed in place, not taken out. The case is seen red with `daemon.ts:2694` handing `pushBranch` the branch's name.

```seal
verdict: fixed 4933560
answer: The finding's case stands in the describe "the pull request stage of a work item's chain" of `test/chain.test.ts`: a `git` first on the stage's `PATH` commits in the worktree just before it pushes, and the case holds that the remote's branch and the stored `pushed` are the head the stage checked. The mutant that has `daemon.ts#runPullRequest` hand `pushBranch` the branch's name turns it red (executed, `seal mutate`). The row of `gaps.md` that handed the call to the review rounds is closed in place with this case.
```

### 2. The changelog says Owlery pushes the commit "the seal ... speak[s] of", and the commit pushed is the head, which follows the sealed commit

```seal
severity: should
location: `seal/threads/1795395059-pull-request-and-seal-check/changelog.md:5`
evidence: read `seal/threads/1795395059-pull-request-and-seal-check/changelog.md:5`, `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md:197`, `apps/desktop/src/daemon/daemon.ts:2689-2694`, `apps/desktop/test/chain.test.ts:2869`
regression: round-1#1
```

Why it matters: the unit is the changelog's first bullet, which `e84ade6` rewrote for round 1's finding 1. It now says: "Owlery pushes the commit the seal and its own check of the head speak of, named by its id". The seal speaks of the gate's commit: its verdict block's `target:` names it. The commit pushed is the branch's head, which follows that commit by the commits of the gate's record and of the verdict (`frame/design.md:197`: "The gate's commit is the sealed commit, and the pull request's head follows it by commits of closing records alone"). `test/chain.test.ts:2869` holds the two apart: the sealed commit there is `HEAD~2`. A person reading the release notes, and the reader of each pull request body, which copies `changelog.md` under "What changed", learns that the pushed commit is the sealed one. Then the seal section's `target:`, which names another commit than the pull request's head, reads as a mismatch.

The frame words the fact as the commit the stage read: *Scope* item 4 has the stage push "the whole id of that head", and the `add` of *Rule changes* at `frame/design.md:276` says "the commit it read as the branch's head". The fix pass reached for the seal in the changelog's sentence, and the frame does not say that.

The snippet replaces the bullet's third sentence:

```markdown
Owlery pushes the commit it read as the branch's head, named by its id, so a commit you make on the branch while the stage runs is not pushed.
```

```seal
verdict: fixed dd1a74e
answer: The changelog's bullet now says that Owlery pushes the commit it read as the branch's head, named by its id, as *Scope* item 4 and the `add` of *Rule changes* word it.
```

### 3. A record line that is a marker after U+0085 or U+001C is copied into the body whole, and the check again names the body as not read

```seal
severity: should
location: `apps/desktop/src/daemon/github.ts:453`, `apps/desktop/src/daemon/github.ts:434-438`, `apps/desktop/test/pull-request.test.ts:242-253`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round2.test.ts` (probe 2 of `## Probes`); read `apps/desktop/src/daemon/github.ts:453`, `pr-check/skills/code-review/scripts/chain_check.py:1883-1885`, `pr-check/lib/blocks.py:383-389`, `apps/desktop/src/daemon/record-blocks.ts:73-77`
regression: round-1#3
```

Why it matters: the unit is `marked` in `github.ts#pullRequestBody` (`github.ts:453`), which `e84ade6` added for round 1's finding 3. It counts a line as a marker where JavaScript's `trim` leaves one of the two marker lines. The check counts a line where Python's `str.strip` leaves one (`chain_check.py:1884-1885`). Both split lines the same way, by GFM's line endings (`record-blocks.ts:73-77`, `blocks.py:383-389`). The two strips differ: `str.strip` also takes off U+001C to U+001F and U+0085, which `trim` keeps, and `trim` takes off U+FEFF, which `str.strip` keeps. The probe gave `pullRequestBody` a changelog with each of four spellings of a marker line, then gave each body to `chain_check.py#body` loaded from the clone. With a space or U+FEFF at the line's start, the daemon replaced the changelog's part and the check read the section. With U+0085 or U+001C, the daemon copied the part whole, and the check named the body as not read: "since it holds 2 `<!-- /owlery:seal -->` lines, and a body holds one seal section". So for these spellings the defect of round 1's finding 3 stands: the section the daemon writes is compared with nothing on GitHub.

The frame left the meaning of "white space" open. *Scope* item 9 (`frame/design.md:104`) says a part is replaced where a line "is one of the two marker lines, once the white space at its ends is taken off", and names both readers, `github.ts#withSealSection` and `chain_check.py#body`. The fix took JavaScript's meaning, and the check reads Python's. Such a line is rare, since a person or an agent seldom writes these characters. Still, the set is small and fixed, so the fix can cover it whole. The daemon replaces a part wherever either reader would count a marker. That replaces a little more than the check needs, and loses no seal section.

```ts
// github.ts, beside SECTION_CLOSE.
/**
 * The white space taken off a line's ends before it is compared with a marker:
 * JavaScript's `trim` set, and U+001C to U+001F and U+0085, which Python's
 * `str.strip` in the check (`chain_check.py#body`) also takes off.
 */
const MARKER_ENDS = /^[\s\u001c-\u001f\u0085]+|[\s\u001c-\u001f\u0085]+$/gu;

/** Whether a line is one of the two marker lines for the daemon or for the check. */
function markerLine(line: string): boolean {
  const bare = line.replace(MARKER_ENDS, "");
  return bare === SECTION_OPEN || bare === SECTION_CLOSE;
}

// github.ts, in pullRequestBody, in place of line 453:
  const marked = (text: string): boolean => gfmLines(text).some(markerLine);
```

```ts
// test/pull-request.test.ts, at the end of the case at line 242:
    // A marker after a character the check's str.strip takes off and JavaScript's trim keeps is a marker line too.
    for (const end of ["\u0085", "\u001c"]) {
      const spelt = records(made, { changelog: `- The section ends at:\n\n${end}${SECTION_CLOSE}\n` });
      expect(pullRequestBody(await bodyRecords(made.repo, spelt, DIRECTORY), 1_000_000), JSON.stringify(end)).toBe(`${[SECTION, held("## What changed", "changelog.md"), ROUNDS, GATE_PART, DECIDED].join("\n\n")}\n`);
    }
```

The snippet does not cover three other statements of the fact, and the fix pass owes them too. The doc comment of `pullRequestBody` (`github.ts:434-438`) says "once the white space at its ends is taken off", and it should say whose white space: either reader's. *Scope* item 9 says the same and is the framer's to fold. `withSealSection` (`github.ts:474`) counts the markers of a body GitHub holds with `trim`. It is a unit of phase 2 and outside this round's bound, so `## Not judged` names it. The case is seen red against `github.ts:453` as it stands.

```seal
verdict: fixed 5257869
location: `pr-check/skills/code-review/scripts/chain_check.py`, `apps/desktop/test/pr-check.test.ts`, `seal/threads/1795395059-pull-request-and-seal-check/changelog.md`
answer: The two characters were not added. The fix pass decided what a marker line is, as one rule both readers hold: a line is a marker line where it is one of the two markers once the spaces and tabs at its ends are taken off, and no other character is taken off. Lines are split at GFM's line endings first, as both readers already did. `github.ts#markerOf` states the rule, and `pullRequestBody`'s `marked` and `withSealSection` read through it; `chain_check.py#marker_of` states it for the check's `body`. Each comment states the rule, with no list of characters. Its inputs are the characters at a line's ends, in three kinds: a space and a tab, which are taken off, and any other character, which is kept, so the line is no marker. Each kind is pinned in each reader: the body's case and the section's case of `test/pull-request.test.ts`, and the case of `test/pr-check.test.ts` that names a body as not read, which also has the check read a body whose seal section has spaces and tabs around its markers and whose lines below quote a marker after U+0085, U+001C or U+FEFF, the characters the round measured, as examples of the other kind. Seen red against `e7d94d9`'s readers; eight mutants, among them each reader stripping its language's white space, stripping nothing and stripping spaces alone, were red (executed, `seal mutate`). The changelog's bullet says the rule. *Scope* item 9 still says "once the white space at its ends is taken off", which is the framer's to fold.
```

### 4. The bundle's proofer still reads `pr.md` whole in every round, and the bundle's own row of `pr.md` now says nobody writes one

```seal
severity: should
location: `apps/desktop/role-bundle/agents/proofer.md:29-32`, `seal/threads/1795395059-pull-request-and-seal-check/gaps.md:36`, `apps/desktop/test/role-bundle.test.ts:119-123`
evidence: executed `git grep -n -e 'pr\.md' -e 'pr\.<lang>' -- apps/desktop/role-bundle` and `git grep -n -i -e body -e pr-wait -e 'pull request opens' -- apps/desktop/role-bundle`; read `apps/desktop/role-bundle/agents/proofer.md:29-32`, `apps/desktop/role-bundle/agents/proofer.md:118-138`, `apps/desktop/role-bundle/skills/implement/SKILL.md:292`, `apps/desktop/role-bundle/README.md:23`
reopens: round-1#7
```

Why it matters: the close of finding 7 holds for the four lines the finding located, and the defect stands in a fifth. Finding 7's fact was that the bundle describes the pull request's body by AgenticSeal's composer and its `pr.md`, and round 1 named the row of `pr.md` among its lines. Round 1 also said its search for `pr-body` was a sample of the class. The close ran the same search alone (`git grep -n pr-body`), which lists one spelling and not the class. A search for the record's name, `pr.md`, lists two files: `skills/implement/SKILL.md:292`, which the fix rewrote, and `agents/proofer.md` at lines 31, 127, 129, 131, 132 and 136. Lines 127 to 136 hold a round to `pr.md`'s quotes and to `pr.<lang>.md`'s renderings, and they say nothing where no such file stands. Line 31 does not. Step 3 has every round read `` `changelog.md`, `pr.md` and, where one stands, `pr.<lang>.md`, each whole ``, so it treats `pr.md` as a record every work item holds. The row the fix wrote at `skills/implement/SKILL.md:292` says "nobody: Owlery's daemon writes no `pr.md`". So the bundle now gives a proofer two contradicting facts. The proofer acts on step 3: it opens a file that is not there, and it can write the absence up as a finding that a crafter then answers by writing a `pr.md` no stage copies.

`gaps.md:36` leaves the line. It argues that what a round reads is the review stage's text, which *Scope* does not name. Finding 7's lines were outside *Scope* too, and the bundle's `README.md:23` gives a role's text to the issue that builds its stage; the stage whose body `pr.md` composed is this one. `gaps.md:36` also says that a `pr.md` a person commits is still a record a round can read. That is right, and it is why the fix keeps the read where one stands. It does not remove the read.

```markdown
3. Read the work item's directory your prompt names: `routing.md`,
   `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md` and
   `changelog.md`, and, where one stands, `pr.md` and `pr.<lang>.md`, each
   whole at the target, then
```

The snippet replaces `agents/proofer.md:29-32`, and the rest of step 3 from `` `trail/phases/` `` on stays. In the same commit, the fix pass owes `gaps.md:36`, the paragraph of *Not done* that leaves the line, which is removed. It also owes one assertion in the case at `test/role-bundle.test.ts:119`:

```ts
    expect(read("agents/proofer.md").replace(/\s+/gu, " ")).toContain("`changelog.md`, and, where one stands, `pr.md` and `pr.<lang>.md`, each whole at the target");
```

```seal
verdict: fixed d83717f
location: `seal/threads/1795395059-pull-request-and-seal-check/gaps.md`
answer: Step 3 of the bundle's `agents/proofer.md` takes the finding's text: a round reads `pr.md` and `pr.<lang>.md` where one stands. The case at `test/role-bundle.test.ts` holds the sentence, and the mutant that puts back the read of `pr.md` in every round turned it red (executed, `seal mutate`). The paragraph of `gaps.md` *Not done* that left the line was removed at `4933560`. This answers the reopened round-1#7: with `git grep -n pr\.md -- apps/desktop/role-bundle`, the bundle's lines on `pr.md` are step 3, which reads it where one stands, the proofer's lines 127 to 136, which hold a `pr.md` and a `pr.<lang>.md` that stand to their sources, and the row of `skills/implement/SKILL.md`, which says nobody writes one.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: the stage pushes the commit it checked. `github.ts#pushBranch` runs `git push <remote> <commit>:refs/heads/<branch>` (`apps/desktop/src/daemon/github.ts:233`), and `daemon.ts#runPullRequest` hands it the head read at `daemon.ts:2689` and compared at `:2690` (`daemon.ts:2694`), and stores that head as `pushed` (`:2715`), read. The upstream is written with `git config` after a push that ended well, and a config that fails throws (`github.ts:240-246`), read. Executed: `test/pull-request.test.ts` passed whole (22 cases), and with the config's `throw` removed the case at `:109` failed at its line 125. The probe of finding 1 shows that a commit landing between the check and the push does not reach the remote. Findings 1 and 2 above are the case and the sentence this fix left.

```seal
confirms: round-1#2
```
What holds: a refused push's sentence skips git's `To <address>` line (`apps/desktop/src/daemon/github.ts:236-238`), read. Executed: with the filter removed, the case of `test/chain.test.ts:2958` failed at its line 2966 for the push behind a moved branch (`:2982-2993`), and its sentence read "git push to origin failed: To" and the bare remote's path. On `e7d94d9` the stage's nine cases passed. *Scope* item 4 and scenario 5 say the same. The case's comment calls the mover "a second clone", and the case pushes from the worktree's own repository (`made.repo`). That is a comment that says more than the case does, and the behaviour it pins is the frame's, so it is no finding.

```seal
confirms: round-1#3
```
What holds for the spellings round 1 named, a marker line inside a fence, and a closing marker with white space at its ends: `pullRequestBody` replaces such a part whatever the body's length (`apps/desktop/src/daemon/github.ts:453-454`), read. Executed: with `marked` made to answer false, the case at `test/pull-request.test.ts:242` failed at its line 247. In the probe of finding 3, the check read the section of the body the daemon wrote for a space at the line's start. Finding 3 above is the class this fix did not cover whole.

```seal
confirms: round-1#4
```
What holds: `frame/design.md:337-348` holds the two `change` operations on the sentence that lists the views, and each `from` stands at `docs/design.md:497` and `docs/design.ko.md:497`, executed (`git grep -n -F` of each `from`). `gaps.md:34` says the three sentences in each edition are folded, at `dfd7f67` and `c06a583`, and each edition's operations on the paragraph are those three, read. The plugin's chain check parsed the frame's `## Rule changes` with no refusal (probe 6).

```seal
confirms: round-1#5
```
What holds: `README.md:28` and `README.ko.md:28` each say that the job `seal` fails where `Owlery seal` fails and passes where it passes or is neutral, read against `chain_check.py#outcome` (`pr-check/skills/code-review/scripts/chain_check.py:2463-2477`). There, a draft that would be refused exits 0 as `neutral`, and every `failure` exits 1 or 2. Each edition holds 6 headings and 15 table rows (executed: `grep -c '^#'` and `grep -c '^|'` of each). The comparison of the two editions stays the broad gate's.

```seal
confirms: round-1#6
```
What holds: `pr.md:8` says the check passes "Sealed at" "where no arm of the check refuses anything", and `chain_check.py:2465-2477` gives `success` with that title only where no arm refused, read. `pr.md:8` is the only line `742ba93` changed (executed: `git show --stat 742ba93`).

```seal
confirms: round-1#8
```
What holds: the two `to:` lines at `frame/design.md:286` and `:291` send the reader to `README.md` *The seal check on GitHub* and to `README.ko.md` 「GitHub의 인장 검사」 for the check's name, its results, the administrator's rule and a fork's pull request, read. The plugin's chain check, run with `--worktree` and `PATH=/usr/bin:/bin`, printed no notice at a line of `frame/design.md` (probe 6).

What matched: the new cases were each read against their group, and none repeats another. The push's case at `test/pull-request.test.ts:109` is the first case of `pushBranch` in its describe. The marker case at `:242` holds a part replaced at any length, where the limit's case beside it holds parts replaced past the limit. The behind-the-remote push in `test/chain.test.ts:2982` reads git's `To` line, and the hook's refusal before it reads a `remote:` line. The case of finding 7 at `test/role-bundle.test.ts:119` holds the bundle's core, implement and round-record files, where the case at `:110` holds the sealer's definition, the guarantee's form and its template. The fix pass named one placement as a question: the case of finding 7 stands in `test/role-bundle.test.ts`, a file no scenario names. Finding 7 located its lines in the role bundle, outside every *Scope* item and scenario, and this file is where the repository pins the bundle's sentences (`test/role-bundle.test.ts:85-104`, `:110-117`, `:136-158`), so the placement is the group's. The case holds no fact a *Scope* item states, and that is no gap, since its guard is contract rule 19 and not the frame. It was seen red by the fix pass's three mutants, a claim this round did not run again.

What matched: the frame's fold at `c06a583` states each fact the fix pass built, read at `frame/design.md:5`, `:71`, `:99`, `:104`, `:177-179`, `:216` and `:276-291`, at `frame/plan.md:51-52`, `:64-66`, `:101` and `:115`, and at `frame/questions.md:5` and `:8`. The read of the whole files at `e7d94d9` found no sentence the target contradicts, beyond the sentences of findings 2 to 4. `gaps.md`'s diff over the fix range takes out no row of `## Not verified`. It adds two rows, at `:26` and `:27`, and rewrites two paragraphs of `## Not done` in place, at `:34` and `:36`, read.

What matched: the fix pass's label of the whole suite is `unverified`, with the orchestrator's broad gate as its answerer (`gaps.md:26`), and the label is honest: the row names the narrow files the pass ran and nothing more.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether `withSealSection`, which counts the markers of a body GitHub holds with JavaScript's `trim`, should count them with the white space of finding 3, so that a person's line the check counts as a marker is one for the daemon too. It is a unit of phase 2 and outside this round's bound | `apps/desktop/src/daemon/github.ts:474-476` | The fix pass of finding 3, or the orchestrator |
| The whole suite, the typecheck and the lint at `e7d94d9`, and the `app` files the fix pass ran in its batch | `seal/threads/1795395059-pull-request-and-seal-check/gaps.md:26` | The orchestrator's broad gate, after the review rounds |

## Probes

| Command | Result |
|---|---|
| 1. In the clone at `e7d94d9`, `node scripts/test-in-electron.mjs test/pull-request.test.ts`, `... test/role-bundle.test.ts -t "describes the check's body arm"` and `... test/chain.test.ts -t "the pull request stage of a work item's chain"` | Exit 0 each: 22 passed; 1 passed and 14 skipped; 9 passed and 142 skipped |
| 2. `node scripts/test-in-electron.mjs test/test_tmp_round2.test.ts`, first run | Exit 0, and nothing of the probe could be read: Vitest printed none of the probe's `console.log` lines |
| 2. The same probe, run again with its results written to a file in the scratch directory | Exit 0. `pullRequestBody` replaced the changelog's part for a space and for U+FEFF at the marker line's start, and copied it whole for U+0085 and for U+001C. `chain_check.py#body`, loaded from the clone, read the section for the first two bodies and named the last two as not read: "since it holds 2 `<!-- /owlery:seal -->` lines" for U+0085, and two `<!-- owlery:seal -->` lines for U+001C |
| 3. `node scripts/test-in-electron.mjs test/chain.test.ts -t "the pull request stage of a work item's chain"`, with `daemon.ts:2694` made `pushBranch(cli, target.remote, branch, branch)` | Exit 0, 9 passed: the mutant survived every case of the stage |
| 4. `node scripts/test-in-electron.mjs test/test_tmp_round2_push.test.ts`, the case of finding 1 with its `git` first on the stage's `PATH`, run once against the mutant of probe 3 and once against `e7d94d9` | Against the mutant: failed at its line 26, the remote's branch holding the later commit and not the head the stage read. Against `e7d94d9`: passed. The probe was run twice because one run cannot show it both red and green |
| 5. With three guards of `github.ts` removed at once (the `To` line filter, the `throw` of a failed `git config`, and `marked`), `node scripts/test-in-electron.mjs test/pull-request.test.ts` and `... test/chain.test.ts -t "stops the chain where the stage fails"` | Exit 1 each. `test/pull-request.test.ts` failed at its lines 125 and 247, the config's and the marker's assertions. `test/chain.test.ts` failed at line 2966 for the push behind a moved branch, whose sentence held git's `To` line. `github.ts` and `daemon.ts` were then restored with `git checkout` in the clone |
| 6. The plugin's `PATH=/usr/bin:/bin python3 skills/code-review/scripts/chain_check.py --baseline origin/release/v0.0.2 --root <the branch worktree> --worktree`, run before this record was written | Exit 0. It named each finding round 1 closed as owed a verifying round, `trail/gate.md` and `guarantee.md` as not carried, and the body as not read under `--worktree`. It printed no notice at `frame/design.md`. No `gh` stood on its `PATH`, and it named the pull request's state as unknown |
| 7. The same command, run over this record before the hand-back | Exit 0. It refused each of this record's four findings as open, which the fix pass answers, named `trail/gate.md` and `guarantee.md` as not carried, and refused nothing else of this record. It printed no notice at `frame/design.md` |
