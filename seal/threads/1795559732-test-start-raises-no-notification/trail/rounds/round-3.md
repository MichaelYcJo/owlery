# Review round 3: 1795559732-test-start-raises-no-notification

```seal
target: f697d264, fixes 49cce4be..f697d264
```

Round 3 is a verifying round over `49cce4be..f697d264`. Its three commits touch `frame/plan.md`, `pr.md`, `routing.md` and `trail/rounds/round-2.md`, and no code. The round read those four files at `f697d264`. It carried the rest of round 2's reading and did not establish it again. That reading covers the code under `apps/desktop/`, which the range does not touch, and the search of `docs/` at the base `4a005eb` for a sentence on what a background start does with a notification.

## Findings

None.

## Confirmations

```seal
confirms: round-2#1
```
What holds: the row of `frame/plan.md` *Judgments of the run* was rewritten in place (`frame/plan.md:63`). It now says the title takes `feat:`, and that `test:` came closest. Its grounds stand on the table under *Commit messages* in the plugin's `skills/commit-pr-convention/SKILL.md`. A background start, a test's or an agent's, now holds its notifications back, and the preload gains `background`, so the change is met outside the tests. No sentence of `docs/` at the base stated the rule, so `fix:` has none to stand on. A change's own tests do not decide its prefix. The sentence the row quotes, "for a test's start and an agent's alike", stands at `frame/plan.md:24`, the chosen row of *Alternatives considered*, which the row names as its coordinate. Two grounds of the old row are gone: the issue's title as grounds, and who the change reaches. `pr.md:3` quotes the new *Judgment* cell word for word (`git grep -n -F`, executed). Read.

What matched: the branch follows the title. The current branch is `feat/154-a-test-start-can-still-raise-a-macos-notification`, `routing.md:10` names it, and the form is `<prefix>/<issue number>-<slug>` of *Branch names* in the same skill. Issue #154's title is now `feat: a test start can still raise a macOS notification over the owner's screen` (`gh issue view 154 --json title`, executed). No present-tense record of the work item still names `test/154` or a `test:` title. The only hits of `git grep -n -E "test/154|\`test:\`"` are the row, its quote, and the earlier round records, which state history (executed). `chain_check.py --worktree` reads the renamed branch, and it refuses nothing but the absent `trail/gate.md` and `guarantee.md`, which come after the rounds (executed).

The close names `fixed 19d0f08e`. That commit rewrote the row, `pr.md`, and `routing.md`. `d5f9fdbc` then corrected the row's coordinate, which the answer says. Read.

The build's commits keep their `test:` subjects (`426b32be`, `23167047`, `1a6710aa`, `1b9ab01e`). The skill gives a commit that builds the change the pull request's kind. Rewriting those subjects would mean a rebase, which orphans the hashes the records cite, and the pull request merges into `release/v0.0.4` by squash under the new title (`routing.md`). So the subjects do not reach the base, and this is no finding.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the typecheck and the built-app files no round or phase ran | `gaps.md` *Not verified* | the orchestrator's broad gate |
| Whether a person's start still shows the banner | `frame/questions.md` Q1 | the owner, at the release walk |

## Probes

| Command | Result |
|---|---|
| `python3 skills/code-review/scripts/chain_check.py --baseline 4a005eb --root <the worktree> --worktree`, the plugin's script | exit 0; it names only the absent `trail/gate.md` and `guarantee.md` |
| `gh issue view 154 --json title -q .title` | `feat: a test start can still raise a macOS notification over the owner's screen` |
