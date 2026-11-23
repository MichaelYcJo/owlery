# Review round 1: 1795395059-pull-request-and-seal-check

```seal
target: 029ed53 against release/v0.0.2
```

The whole branch was read against `release/v0.0.2` at `de2257c`, the commit the branch merged at `1e65c7a`. No earlier round exists, so no fact is carried and every fact below was established in this round. The work item's records that state the present were read whole at `029ed53`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. `pr.<lang>.md` does not stand, since `Commit and pull request language` is English. `trail/phases/phase-1.md` to `phase-4.md` were read as the crafters' account. The tree holds no `seal/parity.json`, so no parity comparison was owed.

The axes this change adds to the table were fixed before the read: the window between the read of the head and the push; a partial failure, where the push landed and `gh` failed; what a copied record can do to the body's markers; the words a person reads when a stage stops; and the order in which the settle applies two work items' operations on one paragraph.

## Findings

### 1. The push sends the branch's tip, not the commit the stage checked, so a commit that lands after the check reaches the pull request unsealed

```seal
severity: must
location: `apps/desktop/src/daemon/github.ts:219-232`, `apps/desktop/src/daemon/daemon.ts:2688-2693`, `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md:95`
evidence: read `apps/desktop/src/daemon/daemon.ts:2688`, `apps/desktop/src/daemon/daemon.ts:2693`, `apps/desktop/src/daemon/daemon.ts:2714`, `apps/desktop/src/daemon/github.ts:227`; executed `python3 -I -B test_tmp_round1.py` (probe 3)
```

Why it matters: this is the fourth invariant, "no pull request without a seal". The stage reads the worktree's head at `daemon.ts:2688` and stops where it moved, which phase 2's record gives as the guard against "a push of a head the order did not read". The push at `daemon.ts:2693` does not push that commit. `github.ts:227` pushes `refs/heads/<branch>:refs/heads/<branch>`, the branch's tip at the moment git runs. Between the check and the push the stage runs `pushTarget`, `bodyRecords` and `pullRequestTitle`, each one or more git processes. A commit made in that window by the person's terminal or by another pane in the worktree is pushed. `gh pr create` then opens the pull request on that commit, and the body's seal section says "as this pull request's head commit holds it", which is false. The stage also stores `pushed: head` at `daemon.ts:2714`, the commit it checked, while the remote holds another. So the watch reads GitHub's head as not the pushed one and reads again every `PR_POLL_MS` until the next seal. The check on GitHub still refuses that head through the guarantee arm, so a required `Owlery seal` holds the merge. The daemon's own guard does not hold, though, and it is the guard the invariant names for the daemon.

Probe 3 read a head, made a commit, then ran the stage's push form against a bare remote: the remote held the later commit, not the one read.

The fix names the commit in the push and writes the upstream that `--set-upstream` wrote. Precondition at the OS boundary: `git config` runs in the worktree and writes the repository's config in its common git directory, which `git push --set-upstream` writes today, so it assumes nothing new.

```ts
/**
 * Pushes the commit given to the branch on the remote with the person's git,
 * from the worktree: `git push <remote> <commit>:refs/heads/<branch>`, with
 * no force, with `GIT_TERMINAL_PROMPT=0` so a push that would ask for a
 * credential fails, and with the repository's own push hooks. The commit is
 * named by its id, so a commit that lands on the branch after the stage read
 * its head is not pushed. The remote's branch is then written as the local
 * branch's upstream. It throws, with the second half of a sentence that holds
 * git's first line, where the push did not end well.
 */
export async function pushBranch(cli: GitHubCli, remote: string, branch: string, commit: string): Promise<void> {
  const ended = await runProcess("git", ["push", remote, `${commit}:refs/heads/${branch}`], { cwd: cli.cwd, env: { ...cli.env, GIT_TERMINAL_PROMPT: "0" }, limitMs: cli.limitMs });
  const why = whyFailed(`git push to ${remote}`, ended, cli.limitMs);
  if (why !== null) {
    const line = ended.code === null ? null : firstLine(ended.err);
    throw new Error(line === null ? why : `git push to ${remote} failed: ${line}`);
  }
  // The push names a commit and not the branch, so the branch's upstream is written here.
  for (const [key, value] of [
    [`branch.${branch}.remote`, remote],
    [`branch.${branch}.merge`, `refs/heads/${branch}`],
  ] as const) {
    const set = await runProcess("git", ["config", key, value], { cwd: cli.cwd, env: cli.env, limitMs: cli.limitMs });
    const failed = whyFailed(`git config ${key}`, set, cli.limitMs);
    if (failed !== null) throw new Error(failed);
  }
}
```

```ts
// daemon.ts, in runPullRequest
      await pushBranch(cli, target.remote, branch, head);
```

The snippet leaves three statements the fix pass owes too. `frame/design.md:95`, *Scope* item 4, says "The daemon runs `git push --set-upstream <remote> <branch>`". The doc comment of `runPullRequest` (`daemon.ts:2640-2650`) says "pushes the branch". A case owed in `apps/desktop/test/pull-request.test.ts` reads the head, commits on the branch, calls `pushBranch` with the read head, and holds that the bare remote's branch is the read head and that `branch.<b>.remote` and `branch.<b>.merge` are set. It is seen red against `github.ts:227` as it stands. Finding 2 changes the same function, and the two fixes compose.

```seal
verdict: fixed e84ade6
location: `apps/desktop/test/pull-request.test.ts`, `seal/threads/1795395059-pull-request-and-seal-check/changelog.md`
answer: `github.ts#pushBranch` pushes the commit it is given, `git push <remote> <commit>:refs/heads/<branch>`, then writes `branch.<b>.remote` and `branch.<b>.merge` with `git config`, and a config that fails fails the stage; `daemon.ts#runPullRequest` hands it the head it checked, and its doc comment and the changelog's push bullet say so. The case of scenario 6 in `test/pull-request.test.ts` (with the config failure added at `7fe8ef0`) was seen red against the push of the branch's name. The frame's part was folded at `c06a583`. The mutant that has the daemon push the branch's name survived the chain's cases, since no case commits between the check and the push, and `gaps.md` names it.
```

### 2. A push the remote refuses as not a fast-forward stops the chain with "git push to origin failed: To <address>", which says nothing of why

```seal
severity: should
location: `apps/desktop/src/daemon/github.ts:230-231`, `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md:95`
evidence: executed `python3 -I -B test_tmp_round1.py` (probe 1); read `apps/desktop/src/daemon/github.ts:230`, `seal/threads/1795395059-pull-request-and-seal-check/trail/phases/phase-2.md:13`
```

Why it matters: the chain's sentence is what the work item's line shows under "Needs you", and the person acts on it. `github.ts:230` takes the first non-empty line of git's error stream. For a push with no hook, git prints `To <address>` first. Probe 1 made a second clone move the remote's branch and then pushed from the first clone with the stage's arguments: git exited 1, and the first line of its error stream was `To <the remote's path>`. The reason, `! [rejected] feat -> feat (fetch first)` or `(non-fast-forward)`, follows on the next line. Phase 2's record names this: "With no hook, git prints `To <address>` first, and that is the line the sentence holds. No case shows the second." A refused push of a branch that moved on the remote is the likeliest refusal: a second machine, a person's own push, or a rebase after the first pull request opened. *Scope* item 4 says the sentence holds "git's first line", and the frame meant the line that says why.

```ts
// github.ts, in pushBranch: git's `To <address>` line names the remote and not the refusal.
  const said = ended.err.split("\n").filter((line) => !line.trim().startsWith("To ")).join("\n");
  const line = ended.code === null ? null : firstLine(said);
```

The fix pass owes `frame/design.md:95` the same words: "fails the stage with git's first line that is not its `To <address>` line". A case owed in `apps/desktop/test/pull-request.test.ts` pushes after a second clone moved the remote's branch and holds that the sentence names `rejected`.

```seal
verdict: fixed e84ade6
location: `apps/desktop/test/chain.test.ts`, `seal/threads/1795395059-pull-request-and-seal-check/changelog.md`
answer: A refused push's sentence holds git's first line that is not its `To <address>` line. Scenario 5's case in `test/chain.test.ts` moves the remote's branch from the main clone and holds that the sentence names `! [rejected]`; it was seen red with the `To <path>` line. The changelog gives the example. The frame's part was folded at `c06a583`.
```

### 3. A record line that is a marker alone, copied below the seal section, leaves the section unread by the check and fails every later update

```seal
severity: should
location: `apps/desktop/src/daemon/github.ts:421-438`, `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md:100`
evidence: executed `python3 -I -B test_tmp_round1.py` (probe 2); read `apps/desktop/src/daemon/github.ts:424`, `apps/desktop/src/daemon/github.ts:455-462`, `pr-check/skills/code-review/scripts/chain_check.py:1884-1885`
```

Why it matters: `pullRequestBody` copies `changelog.md` whole below the seal section (`github.ts:424`), and the newest run block of `trail/gate.md` and the decisions too. Neither the daemon nor the check reads a fence when it counts marker lines: each counts every line that is `<!-- owlery:seal -->` or `<!-- /owlery:seal -->` once trimmed (`github.ts:455-456`, `chain_check.py:1884-1885`). A changelog that shows the body's form in a fenced block, as `frame/design.md` *Data & interfaces* does, holds such a line. Probe 2 handed `chain_check.py#body` the daemon's seal section followed by such a changelog. It refused nothing and named the body as not read: "it holds 2 `<!-- owlery:seal -->` lines, and a body holds one seal section". So the section the daemon wrote is compared with nothing on GitHub. At the next seal, `withSealSection` throws at `github.ts:462`, and the stage stops at every later "Get a seal" until a person edits the body by hand. The records are the daemon's input, so the daemon is the one place that can keep a marker line out of the parts it copies.

```ts
// github.ts, in pullRequestBody: a part holding a line that is a marker alone gives way to the line that names its record, as at the limit, so the body holds one seal section.
  const marked = (text: string): boolean => gfmLines(text).some((line) => line.trim() === SECTION_OPEN || line.trim() === SECTION_CLOSE);
  const texts = parts.map(({ whole, held }) => (marked(whole) ? held : whole));
```

The fix pass owes the doc comment of `pullRequestBody` (`github.ts:412-420`) and *Scope* item 9 (`frame/design.md:100`) one sentence saying that such a part is replaced by its line, and the changelog's bullet "The body opens with the seal" the same. A case owed in `apps/desktop/test/pull-request.test.ts` holds a changelog with a fenced marker line and holds that the body has one opening and one closing marker. It is seen red against `github.ts:434` as it stands.

```seal
verdict: fixed e84ade6
location: `apps/desktop/test/pull-request.test.ts`, `seal/threads/1795395059-pull-request-and-seal-check/changelog.md`
answer: `github.ts#pullRequestBody` replaces a part whose text holds a marker line, once trimmed, by its heading and the line naming its record, whatever the body's length, and its doc comment and the changelog's body bullet say so. Scenario 7's case in `test/pull-request.test.ts` holds one opening and one closing marker and was seen red at `github.ts:434`; the case of a closing marker alone with white space was added at `7fe8ef0` after two mutants survived. The frame's part was folded at `c06a583`.
```

### 4. The rule changes on the screenshot section leave its list of five views, and `gaps.md` still lists the fold as not done

```seal
severity: should
location: `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md:309-332`, `seal/threads/1795395059-pull-request-and-seal-check/gaps.md:32`, `docs/design.md:497`, `docs/design.ko.md:497`
evidence: read `docs/design.md:497`, `docs/design.ko.md:497`, `apps/desktop/test/screenshots.ts:11`, `seal/threads/1795395059-pull-request-and-seal-check/gaps.md:32`; executed `git grep -n "a menu and a dialog" -- seal/threads docs`
```

Why it matters: the settle writes `docs/` from *Rule changes*, so a sentence no operation reaches stays as it is. `docs/design.md:497` says that "the views are the inbox, a work item's view, the view of a work item parked with questions, a menu and a dialog". `test/screenshots.ts:11` now holds six views, `finished` among them, and the `change` at `frame/design.md:321` says "six views" in the next paragraph. The search found no pending operation of any work item on that sentence. The folded operations at `dfd7f67` cover the chains and the count of files, not this list. `gaps.md:32` stands under `## Not done` and says the paragraph "is handed to the orchestrator to fold as a `change`". The fold was made at `dfd7f67`, so a reader of the closing memo takes a done fold for an open one, and does not see that one sentence was left.

On #42's pending operation on the same paragraph: the `from` of this work's first `change` (`frame/design.md:312`) stands at `docs/design.md:499` at the target. #42's `change` (`seal/threads/1795393338-broad-gate-and-sealer/frame/design.md:372-376`) replaces a passage that holds it, and #42 merged first. So `seal settle --draft` names this work's first `change` as not placed. Its `to` restates the first two sentences of #42's `to`, which *settle* step 4 reads as the later decision, so the settle can write the section. That is the settle's design and no finding.

```
- change
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  from: and the views are the inbox, a work item's view, the view of a work item parked with questions, a menu and a dialog.
  to: and the views are the inbox, a work item's view, the view of a work item parked with questions, the view of a finished work item, a menu and a dialog.
    check: apps/desktop/test/screenshots.test.ts
- change
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  from: 화면은 작업함, 작업 화면, 질문 때문에 멈춰 둔 작업의 화면, 메뉴, 대화 상자입니다.
  to: 화면은 작업함, 작업 화면, 질문 때문에 멈춰 둔 작업의 화면, 끝난 작업의 화면, 메뉴, 대화 상자입니다.
    check: apps/desktop/test/screenshots.test.ts
```

`gaps.md:32`, rewritten in place:

```markdown
`docs/design.md` and `docs/design.ko.md` *A pull request that changes the window carries its screenshots* say that the screenshot run starts two chains and writes five views, ten files in Night watch, and phase 4 made it four chains and six views, twelve files. `frame/design.md` *Rule changes* changes the three sentences for the settle to write, folded at `dfd7f67`.
```

The second sentence names "three sentences" once the fix pass has added the two operations above. Where it adds them otherwise, the count in that sentence follows.

```seal
verdict: fixed 756a358
answer: The two `change` operations on the sentence that lists the views were folded at `c06a583`, and `gaps.md` *Not done* now says that the operations change three sentences in each edition, folded at `dfd7f67` and `c06a583`.
```

### 5. The README says the workflow's job ends with the same result as `Owlery seal`, and for a draft and a refused post it does not

```seal
severity: should
location: `README.md:28`, `README.ko.md:28`
evidence: read `README.md:28`, `README.md:34`, `pr-check/skills/code-review/scripts/chain_check.py:2454-2477`
```

Why it matters: the README is what an administrator reads to choose the check to require. `README.md:28` says the check posts `Owlery seal` "and the workflow's own job, `seal`, ends with the same result". `chain_check.py#outcome` gives a draft that would be refused exit 0 and the conclusion `neutral`, so the job passes while the check is neutral. The README's own table gives that row as neutral at `README.md:34`. Where the post is refused, as for a fork's pull request, the job fails or passes and no `Owlery seal` stands at all. `README.ko.md:28` says the same: "워크플로 자신의 잡 `seal`도 같은 결과로 끝납니다".

```markdown
The check posts its verdict as a GitHub check named `Owlery seal` on the pull request's head commit. The workflow's own job, `seal`, fails where `Owlery seal` fails and passes where it passes or is neutral.
```

```markdown
검사는 판정을 PR의 head 커밋에 `Owlery seal`이라는 이름의 GitHub 검사로 올립니다. 워크플로 자신의 잡 `seal`은 `Owlery seal`이 실패하면 실패하고, 통과하거나 중립이면 통과합니다.
```

Each replaces the matching sentence of line 28. The heading and table-row counts of the two editions do not change.

```seal
verdict: fixed be412b4
answer: Both READMEs take the finding's sentences: the job `seal` fails where `Owlery seal` fails and passes where it passes or is neutral. Each edition keeps 6 headings and 15 table rows.
```

### 6. `pr.md` says the check passes "Sealed at" where the guarantee arm refuses nothing, and it passes only where no arm refuses

```seal
severity: should
location: `seal/threads/1795395059-pull-request-and-seal-check/pr.md:8`
evidence: read `seal/threads/1795395059-pull-request-and-seal-check/pr.md:8`, `pr-check/skills/code-review/scripts/chain_check.py:2465-2477`
```

Why it matters: `pr.md` is the pull request's account, and the sealer reads it against the tree. Its row for "the seal check passes on that head commit" ends "passed and titled "Sealed at" with the sealed commit where the guarantee arm refuses nothing". `chain_check.py#outcome` gives a ready pull request `failure`, titled "The records are refused", wherever any other arm refuses, with the guarantee arm silent. `frame/design.md` *Scope* item 23 states the necessary half alone: "reads "Sealed" only where that arm refused nothing".

```markdown
The check posts `Owlery seal` on the pull request's head commit, passed and titled "Sealed at" with the sealed commit where no arm of the check refuses a line
```

The snippet replaces the row's last sentence.

```seal
verdict: fixed 742ba93
answer: The orchestrator repaired `pr.md` at `742ba93`: the check passes "Sealed at" only where no arm refuses.
```

### 7. The role bundle's invariant table still says the body arm fails a body that is not what `seal pr-body` composes

```seal
severity: should
location: `apps/desktop/role-bundle/skills/core/SKILL.md:108`, `apps/desktop/role-bundle/skills/implement/SKILL.md:292`, `apps/desktop/role-bundle/docs/forms/the-round-record.md:21`, `apps/desktop/role-bundle/docs/forms/the-round-record.md:39`
evidence: executed `git grep -n "pr-body" -- apps/desktop/role-bundle`; read `apps/desktop/role-bundle/skills/core/SKILL.md:108`, `apps/desktop/role-bundle/README.md:23`
```

Why it matters: the bundle is what Owlery hands its proofer, crafter and sealer sessions, and its `skills/core/SKILL.md` is read by every one of them. Row 108 states the fourth invariant as held by "its body arm: a ready pull request fails where its body is not what `seal pr-body` composes at HEAD, the seal mark among it". This work rewrote that arm (*Scope* item 22) and removed `pr_body.py`, so the row states a fact the tree no longer holds, and a sealer that acts on it looks for a command and a `pr.md` that Owlery does not have. Contract rule 19 has a change rewrite every other statement of the fact it changes. `gaps.md` *Not done* names the four lines and leaves them because "*Scope* names none of them, and the bundle's `README.md` leaves each taken document to the issue that builds its stage". That issue is this one: `README.md:23` of the bundle says "The issue that builds each stage rewrites its role's text", and this work builds the pull request stage and the arm the row describes. The search for `pr-body` lists the class whole for that spelling: these four lines. Other wordings of the old body arm in the bundle were not searched for, so that part is a sample.

```markdown
| No pull request without a seal | nothing reaches the base that the last independent party did not guarantee | the same check's guarantee arm: a ready pull request fails without `Verdict: sealed` at HEAD; and its body arm: a ready pull request fails where the seal section of its body, which Owlery's daemon writes, is not the newest verdict block of the work item's `guarantee.md` at HEAD |
```

The snippet replaces row 108. The fix pass owes the three other lines too, or a `deferred <home>` naming the issue that takes them: `skills/implement/SKILL.md:292`, the row of `pr.md`, which no "Get a seal" work item writes now; and `docs/forms/the-round-record.md:21` and `:39`, which name lines `seal pr-body` copies, where the daemon's composer now copies each finding's heading and its close's verdict.

```seal
verdict: fixed 5612da0
location: `apps/desktop/test/role-bundle.test.ts`
answer: Row 108 of the bundle's `skills/core/SKILL.md` takes the finding's row in other words: the body arm fails where the body's seal section holds a verdict block other than the newest of `guarantee.md` at HEAD. The row of `pr.md` in `skills/implement/SKILL.md` says that the daemon writes no `pr.md` and composes the body from the records. `docs/forms/the-round-record.md:21` names the lines the daemon copies into the body, and `:39` drops the copy, which the daemon does not make of an `evidence:` line. A case of `test/role-bundle.test.ts` holds the two rows and that none of the three files names `seal pr-body`; three mutants that put each old sentence back were red. `git grep -n pr-body -- apps/desktop/role-bundle` prints nothing. The proofer's definition still reads `pr.md`, which `gaps.md` *Not done* names.
```

### 8. The rule change for *Records are committed to the repository* repeats the README's sentence on the posted check, so the settle leaves the fact in two places

```seal
severity: should
location: `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md:282`, `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md:287`
evidence: executed `python3 skills/code-review/scripts/chain_check.py --baseline origin/release/v0.0.2 --root <the branch worktree> --worktree`; read `README.md:28`, `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md:282`
```

Why it matters: the check's notice at the frame's line reads: "seal/threads/1795395059-pull-request-and-seal-check/frame/design.md:282  this `to` repeats a passage of `README.md`: 5 of its runs of 15 words stand there, one of them "the check posts its verdict as a github check named owlery seal on the pull"". The settle writes that `to` into `docs/architecture.md`, and `README.md:28` keeps the same sentence, so after the settle the posted check's name and commit stand in two documents with no link between them. A run over the `to`'s words found the repeated runs in its first sentence alone. Its third, fourth and sixth sentences restate the README's table, its paragraph on the administrator and its sentence on a fork's pull request in other words. *Scope* item 29 has the README say all of it to the people who connect a repository, so the README is the place a reader is sent to, and the policy keeps the rule.

```
  to: **The check posts its verdict on the pull request's head commit as a check run the job writes, and a pull request's body shows the seal as its record holds it.** The job runs `chain_check.py` with `--post`, and the workflow gives the job the right to write a check. The check's name, what each of its results means, how an administrator makes it required and what a fork's pull request gets are in `README.md` *The seal check on GitHub*, and Owlery changes no setting of the repository on GitHub. A posted check may end as neutral, which a job cannot, and one function of the check decides the result. The body's seal section, between its two marker lines, is a copy of the newest verdict block of `guarantee.md` at the head commit, written by the daemon. The check refuses a section that differs from that block, and reads no other line of the body, which is the person's to edit.
```

```
  to: **검사는 잡이 쓰는 check run으로 판정을 PR의 head 커밋에 올리고, PR의 본문은 기록에 있는 그대로 인장을 보입니다.** 잡은 `chain_check.py`를 `--post`와 함께 돌리고, 워크플로는 잡에 검사를 쓸 권한을 줍니다. 검사의 이름, 결과마다의 뜻, 관리자가 검사를 필수로 정하는 방법, 포크에서 온 PR이 받는 것은 `README.ko.md`의 「GitHub의 인장 검사」에 있고, Owlery는 GitHub에 있는 저장소의 설정을 바꾸지 않습니다. 올린 검사는 잡과 달리 중립으로 끝날 수 있고, 결과는 검사의 함수 하나가 정합니다. 본문의 인장 구역은 두 표시 줄 사이에 있고, head 커밋에 있는 `guarantee.md`의 가장 새 판정 블록을 데몬이 그대로 옮겨 쓴 것입니다. 검사는 그 블록과 다른 구역을 거절하고, 본문의 다른 줄은 읽지 않습니다. 그 줄들은 사람이 고칠 수 있습니다.
```

Each replaces the `to:` line of its operation, at `frame/design.md:282` and `:287`, and keeps its `check:` line. The fix pass reruns the same check with `--worktree` and reads that the notice at line 282 is gone.

```seal
verdict: fixed c06a583
answer: The framer rewrote the two `to:` lines at `c06a583` to point at the README. The plugin's `chain_check.py --worktree`, run with `PATH=/usr/bin:/bin` after the fix pass's last commit `6dc7679`, prints no notice at `frame/design.md`.
```

## Confirmations

What matched: every path to a push or to `gh pr create` and `gh pr edit` is `daemon.ts#runPullRequest`, called once, from the branch of `runChain` at the step `sealed` (`daemon.ts:2160`). Executed: `git grep -n -e "createPullRequest\|editPullRequest\|pushBranch\|runPullRequest(" -- apps/desktop/src` listed those calls alone. The search of scenario 9 for a review or a merge, `git grep -n -e 'pr review' -e 'pr merge' -e 'pulls/.*/reviews' -e 'pulls/.*/merge' -- apps/desktop/src pr-check`, printed nothing and exited 1 (executed). Finding 1 is the one way found by which an unsealed head reaches that path.

What matched: a partial failure leaves nothing a later start cannot finish. Read: where the push landed and a call of `gh` failed or passed its limit, the stage throws before it stores (`daemon.ts:2713-2716`), the chain stops, nothing is committed, and the next "Get a seal" finds the step `sealed`, pushes again with nothing new, and reads GitHub with `gh pr list` before it creates. So a pull request `gh` created before it was stopped is listed and edited, and no second one opens.

What matched: `chain_check.py#outcome` (`chain_check.py:2454-2477`) gives each row of *Data & interfaces*' table of outcomes, read; the title "Sealed at" is built from the newest verdict block of each judged work item only where no arm refused, and the guarantee arm, which reads the judge against the builders, ran over each of them first (`chain_check.py:2399-2407`). Nothing is posted under `--worktree`, `--sealing`, or without `GITHUB_TOKEN`, `GITHUB_REPOSITORY` or a 40-character head (`chain_check.py:2526-2534`, `2582-2595`), read. A refused or failed request is one notice and leaves the exit code (`chain_check.py:2558-2562`), read.

What matched: the six guards of the watch that survived mutation in phase 3 (`gaps.md`, the row of the watch's guards) each hold by reading. `watched` (`daemon.ts:2935-2937`) leaves out a work item whose chain is in `this.chains`, and `runChain` deletes it there before it calls `scheduleWatch`. `readPullRequest` stores nothing where the daemon closed or where the stored pull request is no longer the object the read started from (`daemon.ts:2966`). That comparison holds because `RepositoryStore#workItems` gives the stored objects themselves (`repositories.ts:274-276`) and `setWorkItem` replaces the field with a new object. `scheduleWatch` returns while a turn is under way (`daemon.ts:2913`) and arranges the next turn from the turn's `finally`. The timer's callback returns after a close or with no client (`daemon.ts:2922`), and `close` clears the timer (`daemon.ts:612`). Each pair is two guards on one race, as phase 3 says, so no single mutant of either can be seen red.

What matched: the arms of `github.ts` phase 2 read and did not mutate each do what `gaps.md` says, read. A `gh` that does not start ends through the `error` event, and `whyFailed` names it "did not start" (`github.ts:123-126`, `143`). A call a signal ends by itself is named by that signal, after the limit's own case (`github.ts:142-144`). A list entry with no number or no address throws (`github.ts:270`). A `gh` the user may not run is passed over by `accessSync(X_OK)`, and a folder named `gh` by `isFile` (`github.ts:161-162`). The body's file in the system's temporary folder is a `mkdtemp` folder removed whole at the stage's end (`daemon.ts:2751-2753`).

What matched: phase 4's built-app cases, which were not seen red, each assert what their code draws, read. In `test/get-a-seal.test.ts` the section's `hidden` attribute is set in `index.html` and cleared only by `showPullRequest`, so the wait for "Checks passed" under the seal's place cannot end without it. The two addresses are handed on only by the two listeners `showPullRequest` and `initView` add. In `test/records-dialog.test.ts` `#records-required` is `hidden` in `index.html` and is filled only by `say("records-required", …)` in `renderer.ts#showRecords`. The case's assertion that the stage is not listed under "Ask" passes on the old tree too, since a stage with no session has no row there. It holds a fact *Scope* item 26 states, so it is no gap.

What matched: the sticky foot of the records dialog takes the dialog's own ground in every theme, read. `#records-dialog .row.end` and `dialog` both draw `var(--ground-raised)` (`index.html:469`, `497`), so each theme's value reaches both, and the shadow that covers the padding below the row is the same token. How it looks in each theme and in a window lower than 900 pixels was not seen: no screenshot run captures the dialog, and the built app was not started, since no finding stood on it.

What matched: `frame/plan.md` *Overlap with the release* holds for #44: `chain.ts#stepOwed`, `Standing` and `standingOf` are unchanged in the diff, and the chain rests in the state `sealed` (`daemon.ts:2160`), read.

What matched: the README editions each gained one heading and six table rows, read; the counts the broad gate compares are its own to run.

Three things read with no finding. First, the daemon reads a verdict as a seal by its word alone (`chain.ts:441`); the judge against the builders is refused where the daemon writes the block (`seal-records.ts:230`). A block a person commits by hand with a judge among its builders would reach the stage, and the check on GitHub then refuses the head, so the gap fails closed and is #42's reading. Second, `lib/lines.py#sections`, `#is_separator` and `lib/console.py#to_utf8` have no caller left in `pr-check/` (executed: `git grep -n -w -e sections -e is_separator -e to_utf8 -- .` under `pr-check/` printed their definitions and module docstrings alone). No docstring names a removed caller, and a function nobody calls tells no reader anything wrong, so leaving them is no defect this round records; removing them is a change of the shared readers the frame did not ask for. Third, each new case of `test/pull-request.test.ts` and of `test/pr-check.test.ts` was read against the cases of the function it covers, and none repeats another's assertion.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether `gh pr list --head <branch>` lists a pull request from a fork whose branch has the same name. If it does, the stage edits that pull request's body or stops on two. `Listed.head` is read and never compared with the pushed commit, which would tell them apart. The person's `gh` may not be run in this round | `apps/desktop/src/daemon/github.ts:266-273`, `apps/desktop/src/daemon/daemon.ts:2694-2711` | The first real chain of `frame/questions.md` Q2, or the orchestrator reading `gh`'s source |
| Whether the `seal` job of the run that the push starts, cancelled by `cancel-in-progress` when the body's edit starts a second run on the same head, stays in `statusCheckRollup`. The watch reads a `CANCELLED` conclusion as failed, and the line would say "Check failed: seal" after the later run passed. Between the push and the edit the first run reads the old seal section and refuses it, so a short failure is expected either way | `apps/desktop/src/daemon/records-place.ts:78-82`, `apps/desktop/src/daemon/github.ts:321-324` | The first real chain of `frame/questions.md` Q2 |
| How the records dialog's sticky row of buttons draws in each theme and appearance, and in a window lower than 900 pixels | `apps/desktop/src/renderer/index.html:497` | The orchestrator's built-app batch, or a person's window |
| The whole suite, the typecheck and the lint at `029ed53`. The crafters' label of each is `unverified`, which this round found honest: `gaps.md` names each phase's narrow run and the orchestrator as its answerer | `seal/threads/1795395059-pull-request-and-seal-check/gaps.md` | The orchestrator's broad gate, after the review rounds |

## Probes

| Command | Result |
|---|---|
| `python3 -I -B test_tmp_round1.py`, first run | Ended at its own setup: the second clone was made without `-b feat` and its push was a push of an unrelated history, so git refused it before the probe's cases ran. Nothing of the three cases was read from this run |
| `python3 -I -B test_tmp_round1.py`, run again with the clone made by `-b feat` into a new folder | Exit 0. Probe 1: a push refused as not a fast-forward exited 1, and the first line of git's error stream was `To <the bare remote's path>`. Probe 3: the head read was `2f45517`, a commit `8df3a9c` was made, and the stage's push form left the remote's branch at `8df3a9c`. Probe 2: `chain_check.py#body`, loaded from the clone at `029ed53`, given the daemon's seal section and a changelog whose fenced block holds a marker line, refused nothing and named the body as not read for holding two opening markers |
| The plugin's `python3 skills/code-review/scripts/chain_check.py --baseline origin/release/v0.0.2 --root <the branch worktree> --worktree`, run over the record before the hand-back | Exit 0. It refused each finding of this record as open, which the fix pass answers, and named `trail/gate.md` and `guarantee.md` as not carried, which the gate and the sealer write. It printed one notice, at `frame/design.md:282`, which finding 8 quotes. To learn the pull request's state it ran the person's `gh pr view` on the branch by itself, which answered with exit 1, "no pull requests found for branch". That call is a read of GitHub that this run's rules did not allow, and it was not chosen: the check makes it where no event payload stands. The check was run again after finding 8 was written, with `PATH=/usr/bin:/bin` so that no `gh` stood on it: exit 0, the same notice, each of the eight findings refused as open, and nothing else of this record |
