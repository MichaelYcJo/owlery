# Review round 3: 1795732582-300-202-258-241-timed-cases-hold-under-load

```seal
target: a0e8c9da, fixes 66ab4a96..a0e8c9da
```

This is a verifying round. It reviewed the range from round 2's target `66ab4a96` to HEAD `a0e8c9da` on the branch `test/300-202-258-241-timed-cases-fail-under-load`, whose base is now `origin/release/v0.1.0` at `e7737b7e`, the merge of release 0.0.5 into `main`. The range holds round 2's record (`cbc99f16`) and its close (`4ef88d47`, `7cd49afc`), the orchestrator's `pr.md` and title judgment (`3c932824`), the merge of the new base (`65107e43`), the version move (`ef8db3d9`) and its records (`d26ec5e9`, `a0e8c9da`). It worked in the branch's worktree, which holds the install of the patch at the hash `pnpm-lock.yaml` records, and kept its captured output under its own scratch directory, `<scratchpad>/1795732582-300-202-258-241-timed-cases-hold-under-load/round-3/`.

The code this round reviewed is the merge's result on this work's files and the version move. The rest of what the merge brought is release 0.0.5's own code, which its own review chains read, and this round read it only where it meets this work's cases.

What this round carried from rounds 1 and 2 and did not establish again: where node-pty's `pty_posix_spawn` and `PtyFork` stand, round 1's verdicts on the fetch cases, #258's case, the inbox cases and the comments of *Scope* item 7, and round 2's verdicts on the patch and its second case. They carry because the merge left every line this work changed as it was. For each of the seven files the work changes, this round compared the added and removed lines of the work's diff before the merge (`57449b14..66ab4a96`) with those after it (`e7737b7e..a0e8c9da`), and they were the same (executed, *Probes*). So the release's auto-merged edits of `daemon.test.ts` landed beside this work's hunks and in none of them. They stand in `describe("the daemon's local server")`, `describe("work items")`, `describe("headless sessions")`, `describe("idle exit")`, a new `describe("the daemon's log of how a daemon ended")` and `describe("keeping the Mac awake")`, and not in `describe("the inbox")`, the fetch of a base or the account-change group. The work's cases passed at HEAD after the merge (executed, *Probes*). Every verdict below was reached at this target.

The work item's records were read whole at `a0e8c9da`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, both phase records and rounds 1 and 2. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. `pr.md`, the title judgment of `frame/plan.md:67`, `changelog.md:7` and the new sentence of `routing.md:22` are new in this range, so this round is their first reader. The two findings below are the defects found in them and in the sentence the version move made false.

## Findings

### 1. `frame/plan.md` says this pull request moves no version, and its branch moves the version to 0.1.0

```seal
severity: should
location: `seal/threads/1795732582-300-202-258-241-timed-cases-hold-under-load/frame/plan.md:58`
evidence: executed `git show ef8db3d9` and `git grep -n -e 'moves no version' -e 'no version' -- seal/threads/1795732582-300-202-258-241-timed-cases-hold-under-load/` at `a0e8c9da`; read `routing.md:22`, `changelog.md:7`, `pr.md:12`
```

Why it matters: `frame/plan.md` *Operational impact* says "This pull request moves no version." `ef8db3d9` moves `apps/desktop/package.json` from `0.0.5` to `0.1.0` and moves the three lines of `.github/workflows/owlery-seal.yml` to `v0.1.0` and `release/v0.1.0`. The work item's other records say the same: `routing.md:22`, `changelog.md:7` and `pr.md:12`. The sentence says what the pull request does, so it is read against the target, which contradicts it. The sealer reads the plan's *Operational impact* against the diff, and it would meet two records that disagree on a fact the diff shows.

The search on the sentence's words printed `frame/plan.md:58` alone. That search is a sample: a statement of the fact in other words would escape it. The other records already say the version moves, so the fix below covers the one place and leaves nothing else to repair.

```markdown
- No migration, no environment variable, no new dependency. As the first pull request into `release/v0.1.0`, it moves the version to 0.1.0 (`routing.md` *Why this way*, *Branch*).
```

### 2. The title judgment takes `test:` for a pull request that changes the shipped app's terminal library, against the convention it names

```seal
severity: should
location: `seal/threads/1795732582-300-202-258-241-timed-cases-hold-under-load/frame/plan.md:67`, `seal/threads/1795732582-300-202-258-241-timed-cases-hold-under-load/pr.md:10`
evidence: executed `gh issue view` for #300, #202, #258 and #241, `gh pr list --state all --limit 12`, `gh pr view 299` and `gh pr view 290` for their files under `apps/desktop/src`, and `git grep -n -e prefix -e 'test:' -e 'fix:' -- seal/threads/1795732582-300-202-258-241-timed-cases-hold-under-load/` at `a0e8c9da`; read the plugin's `skills/commit-pr-convention/SKILL.md` *Commit messages*, `frame/plan.md:57`, `changelog.md:5`, `docs/architecture.md:33`
```

Why it matters: the orchestrator titles the pull request from this row, and `pr.md:10` puts it at the top of the body. The row names the plugin's `skills/commit-pr-convention/SKILL.md` as its source, and that document gives another answer.

The convention's table gives `test:` to a change that whoever meets it after the merge meets in "nothing outside the repository's own tests". This change patches `node-pty@1.1.0`, and `frame/plan.md:57` says "The packaged app's `node-pty` binary changes." The fragment's first bullet (`changelog.md:5`) is written for the person who runs the app: a pane that ends no longer leaves a pseudo-terminal open in the daemon. The convention says "Where a change does more than one of these, its prefix is the one highest in the table". `feat:`, `fix:`, `perf:` and `refactor:` stand above `test:` in the table, and the patch is met outside the tests, so `test:` cannot be the prefix.

The row's grounds rest on the issues' titles, and the convention reverses that order. It says "An issue's title takes the prefix the pull request that closes it will take", and the orchestrator retitles an issue whose prefix differs when it titles the pull request. The row's first ground is also wrong as a count: all four issues are titled `test:`, not three of the four (executed). Its second ground says the patch "fixes a leak of the shipped daemon, which a `fix:` would name", which is the convention's answer.

The fix below takes `fix:`. Before the change, `docs/architecture.md:33` states "The daemon stays alive while the app restarts or updates." A daemon that kept two descriptors for each pane it ever started took the machine's 511 pseudo-terminals within that life, and then no terminal on the Mac could start. That is behaviour wrong against a rule the tree stated, which is the table's `fix:`. The orchestrator may read no rule stated before the change. Then the table's answer is `feat:`, for behaviour met on a rule the change itself states (`frame/design.md` *Rule changes*), and it is still not `test:`. The repository's history agrees on the line between them: #297, titled `test:`, changed test files alone, and the product changes of #299 and #290 are titled `fix:` (executed). The branch keeps its name `test/300-…`, which `routing.md:10` records and the chain reads, so the fix leaves it.

The search on the prefix's words printed `frame/plan.md:67` and `pr.md:10`. That search is a sample. The fix covers both, and #300's title is the orchestrator's act when it titles the pull request.

`frame/plan.md:67`:

```markdown
| 2026-11-27 | The pull request's title takes the prefix `fix:`, and it closes #300, #202, #258 and #241. #300 is retitled `fix:` when the pull request is titled. | The patch of `node-pty@1.1.0` changes the packaged app's binary (*Operational impact*), so a person who runs the app meets the change, and `test:` names a change met in the repository's own tests alone. A daemon that leaked a pseudo-terminal at each pane's end left no terminal for any app on the Mac within the life `docs/architecture.md` *Overall layout* gives it ("The daemon stays alive while the app restarts or updates"). Where a change does more than one kind, the highest in the convention's table names it, and an issue's prefix follows the pull request's. | the plugin's `skills/commit-pr-convention/SKILL.md` *Commit messages* |
```

`pr.md:10`:

```markdown
- "The pull request's title takes the prefix `fix:`, and it closes #300, #202, #258 and #241." (`frame/plan.md` *Judgments of the run*)
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: `changelog.md:5-6` are round 2's paste-ready text, word for word (executed: the two lines compared with the fenced block of round 2's finding 1, no difference). Each sentence still holds at the target, because the merge left the patch and the cases as they were (executed, the hunk comparison under *Probes*). Read again: the opening sentence names a start "whose spawn fails", and the last sentence names the spare terminal and the slave that a start failing before its spawn can leave, as `gaps.md:13` does. The inbox sentence names the cases that compare the whole list after a hello that finds a work item, as *Scope* item 6 does. Executed and read.

What matched: the version move is the one `docs/roadmap.md` *Releases and the tracker* gives the first pull request of a release ("The first of those pull requests moves the version"). It touches the same two files as the moves to 0.0.5 (`5f58752b`, #247) and to 0.0.4 (`3c1b3d96`, #209) (executed: `git log -S` on the version line of `apps/desktop/package.json`). `apps/desktop/test/records-place.test.ts:900-903` holds Owlery's own workflow to `workflowText(version)` for the version in `apps/desktop/package.json`, so the workflow's step name and both branches are pinned to the moved version. That file passed 33 of 33 in this round's run, as the orchestrator's account says. No other line of `.github`, `apps/desktop/src`, `apps/desktop/package.json` or the root `package.json` names 0.0.5 as the present version. The comments that say "before release 0.0.5" in `daemon.ts`, `last-look.ts`, `view.ts` and `protocol.ts` name a past release and stay (executed: `git grep -n -e '0\.0\.5' -e 'v0\.0\.5'` over those paths). Executed and read.

What matched: "the first pull request into `release/v0.1.0`" holds. No pull request has that base yet, and `origin/release/v0.1.0` stands at `e7737b7e`, the merge of release 0.0.5 into `main` (executed: `gh pr list --base release/v0.1.0 --state all`, `git log origin/release/v0.1.0 ^origin/main`).

What matched: the new records against the tree. `routing.md:22` names `ef8db3d9` and the two files it changes. `changelog.md:7` says the workflow fetches the check from the tag `v0.1.0`, or from `release/v0.1.0` until the tag exists, which `.github/workflows/owlery-seal.yml:32-39` does. Its bullet has the same form as the 0.0.5 fragment's at `5f58752b`. Each quote of `pr.md` stands word for word at the coordinate it names, and `pr.md:12` quotes the opening of `routing.md:22`'s third sentence. `pr.md` ends with the attribution line, as the `pr.md` files of #297 and #301 did. Read.

What matched: the merge's result on the frame's coordinates. The rule change's sections stand after release 0.0.5's settle: `## Overall layout` at `docs/architecture.md:15` and `## 전체 구성` at `docs/architecture.ko.md:15` (executed: `grep -n '^#'`). `seal/threads/` holds this work item alone at the target, so no other work item's frame changes a section these records cite (executed: `ls seal/threads`). `frame/plan.md:27` rejects an alternative because `docs/architecture.md` *What a session survives* keeps the daemon alive through app updates. The settle of 0.0.5 rewrote that section, and the premise still holds where it matters: a daemon of an earlier build is kept through an update while it runs anything, and it is replaced once it runs nothing (`docs/architecture.md:61`). A daemon with live panes still lives through the update with every descriptor it leaked. Read.

What matched: `chain_check.py --worktree` at the target, before this record, printed no notice at a line of `frame/design.md`. So no test pin or copy of the rule change's `to` text needed weighing. Executed, *Probes*.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the repository-wide lint and the typecheck, `unverified`. This round ran the narrow commands under *Probes*. Once findings 1 and 2 close, which touch the work item's records alone, nothing stays open for the code. The orchestrator's broad run and then the sealer's spawn come due. | `seal/config.json` `Broad gate` | the orchestrator, at the broad gate |
| Whether the hosted runner's and the packaging job's `pnpm install --frozen-lockfile` compile the patched `pty.cc`, carried from round 2. | `frame/questions.md` Q3, `gaps.md:7` | the orchestrator, from the pull request's `check` job and the next run of `.github/workflows/package.yml` |
| Whether the account-change group passes in a whole run of the suite beside another test run, carried from round 2. | `frame/questions.md` Q1, `gaps.md:8` | the orchestrator, at this work item's broad gate and at the gates of #132, #257 and #127 |
| The leftover class of `gaps.md:15` is a sample its two `grep` commands printed on 2026-11-27, before the merge. The cases release 0.0.5 brought into `daemon.test.ts`, such as those of `describe("idle exit")` that read the lists `ready` carries, were not read against it. | `gaps.md:15`, `apps/desktop/test/daemon.test.ts` | the orchestrator, which holds that leftover |
| The pull request's body as `seal pr-body` composes it. The check run with `--worktree` does not read it. | `pr.md`, `changelog.md` | the sealer, at its step 4, and CI on the ready pull request |

## Probes

| Command | Result |
|---|---|
| For each of `apps/desktop/test/daemon.test.ts`, `pty.test.ts`, `worktrees.test.ts`, `claude-adapter.test.ts`, the root `package.json`, `pnpm-lock.yaml` and `patches/node-pty@1.1.0.patch`: the `+` and `-` lines of `git diff -U0 57449b14 66ab4a96`, compared by `diff` with those of `git diff -U0 e7737b7e HEAD` | the same for all seven files |
| `cd apps/desktop && OWLERY_BACKGROUND=1 sh <scratchpad>/heavy.sh node scripts/test-in-electron.mjs test/pty.test.ts test/records-place.test.ts` | exit 0: 2 files, 48 cases passed, 15 of `pty.test.ts` and 33 of `records-place.test.ts`; 28.3 s |
| `cd apps/desktop && OWLERY_BACKGROUND=1 sh <scratchpad>/heavy.sh node scripts/test-in-electron.mjs test/daemon.test.ts -t "has a creation join the fetch of its base\|the inbox\|account\|changed pane\|refuses a change whose pane"` | exit 0: 83 cases passed and 353 skipped, the fetch case, `describe("the inbox")` and the account-change group among those passed; 65.2 s |
| `python3 skills/code-review/scripts/chain_check.py --baseline origin/release/v0.1.0 --root <worktree> --worktree`, before this record | exit 0; it named the verifying round owed after `ef8db3d9`, the gate record and the guarantee not yet written, and no notice at `frame/design.md` |
