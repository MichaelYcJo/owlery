# Review round 2: 1795388701-agent-choices-and-behind

```seal
target: 9bcae53, fixes ce11750..9bcae53
```

A verifying round over the fixes for round 1. The code this round reviews is the diff `ce11750..9bcae53`. Of that range, only `db0198b` touches `apps/`, and it changes `apps/desktop/test/notification-click.test.ts` alone (`executed`: `git diff --stat ce11750..HEAD` and `git log --format='%h %s' ce11750..HEAD -- apps/desktop`). No file of `apps/desktop/src` changed in the range. The rest of the range is records: the orchestrator's raise of the route (`d60ade1`, `d2a64a7`), round 1's record (`d0ddcfc`), its repair of the frame and `pr.md` (`e8a2d2a`), round 1's close (`572a586`) and the fold of the fix pass's hand-back (`9bcae53`).

The work item's records that state the present were read whole at `9bcae53`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, the three phase records and `trail/rounds/round-1.md`. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed, and none stands. The repository declares no `seal/parity.json` (`executed`: `ls seal/parity.json` found none), so no parity comparison is owed.

Carried from round 1 and not re-established: its confirmations of `apps/desktop/src/daemon/agent-events.ts`, `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/src/daemon/worktrees.ts`, `apps/desktop/src/renderer/view.ts` and `apps/desktop/src/renderer/shared.ts`. No byte of `apps/desktop/src` changed in the range, so those verdicts stand on the same code. Also carried: its two `## Not judged` rows on `frame/questions.md` Q1 and on the height of the card of questions.

## Findings

### 1. The routing's grounds for the review still say a defect shows at once in the cases or on screen, which the raise it now names says did not hold

```seal
severity: should
location: `seal/threads/1795388701-agent-choices-and-behind/routing.md:20`
evidence: read `seal/threads/1795388701-agent-choices-and-behind/routing.md:5`, `seal/threads/1795388701-agent-choices-and-behind/routing.md:20`, `seal/threads/1795388701-agent-choices-and-behind/frame/plan.md:73`, and the plugin's `skills/implement/orchestration.md:438-450`
```

Why it matters: `d60ade1` changed the Review cell of `routing.md:5` to `through the review chain`, and rewrote the bullet at `routing.md:20` as "**Review, straight to the PR, raised to through the review chain on 2026-11-23** (`frame/plan.md` *Judgments of the run*): the change adds two read values and their display, and a defect shows at once in the cases or on screen; the sealer's reading of the diff against the issue is the independent reading." The grounds after the colon are the grounds of the first answer, still in the present tense, and they now stand as the grounds of the raised answer. The row the bullet cites, `frame/plan.md:73`, says those grounds failed: "The routing's grounds said a defect shows at once in the cases or on screen. Round 1 found that no case reads the words the card draws … so a defect there shows nowhere." So the work item holds two statements of the same fact, and a reader has to choose between them. That is the correction beside the sentence it corrects that contract rule 19 refuses. The sealer reads `routing.md` when it audits each party's account against the tree. The settle reads routing judgments against what they cost and caught. Each meets the claim "a defect shows at once" stated as still standing. The plugin's guidance asks only for the plan's row where a plan stands (`skills/implement/orchestration.md:445-446`). It allows the bullet's rewrite, but a rewrite has to leave one reading.

The unit is the orchestrator's raise. It is neither a fix pass's commit nor a build phase's, so this finding takes no `regression:` or `reopens:` line. The fix rewrites the one bullet. No other sentence of the work item states the first grounds as standing (`executed`: `git grep -n -e 'straight to the PR' -e 'straight to the pull request' -e 'goes straight'` over the work item's directory, outside `trail/rounds/`, printed `routing.md:20` and `frame/plan.md:73` alone, and the second states them as the first answer's).

```markdown
- **Review, through the review chain, raised from straight to the PR on 2026-11-23** (`frame/plan.md` *Judgments of the run*). The first answer stood on two grounds: the change adds two read values and their display, so a defect would show at once in the cases or on screen, and the sealer's reading of the diff against the issue would be the independent reading. Round 1 found a sentence the card draws that no case read (`trail/rounds/round-1.md` finding 1), so the first ground did not hold, and the review chain reads the diff.
```

```seal
verdict: fixed 802ea33
answer: The orchestrator's commit `802ea33` replaces the bullet at `routing.md:20` with the round's text, word for word. It now names the raised answer, states the first answer's two grounds in the past, and says which of them round 1 showed did not hold. The census the finding ran, outside `trail/rounds/`, found no other sentence stating the first grounds as standing. The commit touches `routing.md` alone, a record of the work item, and this finding is located there alone. Read.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: the built-app case at `apps/desktop/test/notification-click.test.ts:159-229` now feeds a second question with `multiSelect: true` (lines 179-187). It waits for the line's text with " (and 1 more question)" (line 193). Its `card` reader gives `notes`, the text of `.hint` under each `.asked` or `null` (line 206). Both cards, the preview's (line 224) and the view's (line 228), must read `notes: [null, "More than one may be chosen."]` (line 216). `read`: `apps/desktop/src/renderer/shared.ts:281-290` draws the note as a `.hint` span inside the `.asked` element of its question. So removing line 290 gives `[null, null]` and fails at line 224. A note drawn under every question gives a first entry that is not `null` and fails as well. The fix pass's account of its red run, "the failing line is `notification-click.test.ts:224` … the second entry of `notes`, null", is the line this reading predicts. The case's `["Lint", ""]` reads an `.implies` span with empty text. `part` draws one for every choice (`apps/desktop/src/renderer/shared.ts:83-88`), so the reader does not throw. `index.html:165` hides it, which is *Scope* item 8's "what it leads to where the agent said it". The bytes the fix pass ran are the ones at HEAD (`executed`: `git diff --quiet db0198b HEAD -- apps/desktop` exited 0, and `db0198b` is the one commit of the range under `apps/desktop`). Round 1's evidence line, re-run (`executed`): `git grep -n -e 'More than one may be chosen' -e '"hint"' -e '\.hint' -- apps/desktop/test` now prints `notification-click.test.ts:206` and `:216` beside `view.test.ts:3018`. This round did not run the case (see `## Not judged`). The red is settled by reading, and the green is the broad gate's.

```seal
confirms: round-1#2
```
What holds: both `to` texts at `frame/design.md:164` and `frame/design.md:169` now state the words "More than one may be chosen." under a question that takes more than one choice, in `--size-caption` and `--ink-faint`. The Korean text says the same thing as the English one, sentence for sentence. `read` against the code: `apps/desktop/src/renderer/index.html:88` gives `.hint` `--size-caption` and `--ink-faint`. The one other `.hint` rule, `.list-head .hint` at `index.html:276`, applies under the list's head (`index.html:580`) and not in the card. The label in `--ink-strong` and what a choice leads to in `--ink-muted` stand at `index.html:163-164`, as the same texts state.

```seal
confirms: round-1#3
```
What holds: `pr.md:9`, `frame/design.md:12` and `frame/design.md:84` now say that the question tool's name and its input's field names stand in the daemon, and that the protocol and the window name neither. `executed`: `git grep -n -e 'AskUserQuestion' -e 'tool_name' -e 'tool_input' -e 'multiSelect' -- apps/desktop/src` printed lines of `src/daemon/agent-events.ts`, `src/daemon/adapters/claude.ts:94`, `:221` and `src/daemon/daemon.ts:290`, all under `src/daemon`. Scenario 12's search over `src/shared`, `src/renderer` and `src/main` printed nothing and exited 1. `executed`: `git grep -l -e 'AskUserQuestion' -e 'multiSelect' -- . ':!seal'` printed those two daemon files and five test files, and no other source. The sentences speak of the daemon, the protocol and the window, so the tests that feed the tool's payload do not contradict them. The census, `executed`: `git grep -n -e 'reader alone' -e "stay in \`apps/desktop/src/daemon/agent-events.ts\`" -e "daemon's reader" -e 'stand in the daemon'` over the work item's directory, outside `trail/rounds/`, printed the three corrected sentences alone. The words "the daemon's reader" at `frame/design.md:12` name the shapes the protocol carries, not where the names stand. That search is a sample made from the fact's words.

What matched: scenario 11's sentence at `frame/design.md:83`, as `9bcae53` folds it, states what the case does: two questions, the line's " (and 1 more question)", two numbered lists of two items, the words under the second question and none under the first, no control, and the same card in the view. Its "each with its label and what it leads to" covers Lint's empty description through *Scope* item 8's "where the agent said it" (`read`).

What matched: the sentence `9bcae53` changed at `frame/plan.md:58`, "stands first in the release's merge order", agrees with `frame/plan.md:54`, where each other frame of the release names #27 as the one that merges first (`read`). The sentence it replaces, "goes straight to the pull request", no longer held after the raise.

What matched: `frame/plan.md:73`, the raise, is a row of *Judgments of the run*, as the plugin's `skills/implement/orchestration.md:445` asks where a plan stands. `routing.md:5` gives the raised answer (`read`). Finding 1 concerns the bullet alone.

What matched: `pr.md:7-9` quote the three *Done when* lines of issue #27 word for word, without each line's final period (`executed`: `gh issue view 27 --json body`). The cell `e8a2d2a` changed holds no quote.

What matched: the suite's label is honest. `gaps.md:14`, the row the fix pass added, labels the full suite and the repository-wide typecheck at its commit as not run, and names the orchestrator's broad gate (`read`). The range only adds a row to `gaps.md`, so no row left it (`executed`: `git diff ce11750..HEAD` over `gaps.md`).

What matched: the range adds no test case. `db0198b` extends the one case that draws the card, and its `notes` reader holds what no case of its group held before: that `shared.ts#detail` draws the words returned by `view.ts#choiceNote` (pinned at `apps/desktop/test/view.test.ts:3018`), under the question they belong to.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The built-app case at HEAD was not run by this round. Running it starts the built app once, and reading settles the red. The fix pass's green run read the bytes at HEAD, by its account and by `git diff --quiet db0198b HEAD -- apps/desktop` | `apps/desktop/test/notification-click.test.ts` | the orchestrator's broad gate |
| The full suite and the repository-wide typecheck at `9bcae53` | the whole tree | the orchestrator's broad gate, then the sealer's spawn |
| Which events a real interactive Claude Code sends around a call of `AskUserQuestion`, and in which order (`frame/questions.md` Q1), carried from round 1 | `apps/desktop/src/daemon/agent-events.ts:34` | the owner's hand run at the built app with `OWLERY_DEBUG_HOOKS=1` |
| Whether the card of questions needs a bound on its height, carried from round 1 | `apps/desktop/src/renderer/index.html:159` | the sealer, reading the screenshots against `docs/design.md` *Components and their states* |

## Probes

| Command | Result |
|---|---|
| `git diff --stat ce11750..HEAD` | seven files: `apps/desktop/test/notification-click.test.ts` and six records of the work item, no file of `apps/desktop/src` |
| `git diff --quiet db0198b HEAD -- apps/desktop` | exit 0 |
| `git grep -n -e 'More than one may be chosen' -e '"hint"' -e '\.hint' -- apps/desktop/test` | `notification-click.test.ts:206`, `notification-click.test.ts:216`, `view.test.ts:3018` |
| `git grep -n -e 'AskUserQuestion' -e 'tool_name' -e 'tool_input' -e 'multiSelect' -- apps/desktop/src` | lines of `src/daemon/agent-events.ts`, `src/daemon/adapters/claude.ts:94`, `:221`, `src/daemon/daemon.ts:290` |
| `git grep -n 'AskUserQuestion\|tool_input\|tool_name' -- apps/desktop/src/shared apps/desktop/src/renderer apps/desktop/src/main` | nothing printed, exit 1 |
| `git grep -l -e 'AskUserQuestion' -e 'multiSelect' -- . ':!seal'` | two files of `src/daemon` and five test files |
| `git grep -n -e 'reader alone' -e ... -e 'stand in the daemon'` over the work item's directory, outside `trail/rounds/` | `frame/design.md:12`, `frame/design.md:84`, `pr.md:9` |
| `git grep -n -e 'straight to the PR' -e 'straight to the pull request' -e 'goes straight'` over the work item's directory, outside `trail/rounds/` | `routing.md:20`, `frame/plan.md:73` |
| `gh issue view 27 --json body` | the *Done when* holds the three lines `pr.md:7-9` quote |
