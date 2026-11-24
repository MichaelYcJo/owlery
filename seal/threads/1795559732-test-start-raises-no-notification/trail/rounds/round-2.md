# Review round 2: 1795559732-test-start-raises-no-notification

```seal
target: 841c068e, fixes a798da23..841c068e
```

Round 2 is a verifying round. Its code bound is the fix diff `a798da23..841c068e`, which has four commits. `70d1dffc` fills the *Judgments of the run* row and reshapes `pr.md`. `1b9ab01e` adds the last case of `apps/desktop/test/notification-click.test.ts`. `f356dd87` holds the close blocks of round 1. `841c068e` repoints `frame/design.md` *Scope* item 5 and its reloaded-page row.

The round read `frame/design.md`, `frame/plan.md`, `pr.md`, `changelog.md`, `gaps.md` and `routing.md` whole at `841c068e`. `frame/questions.md` and the phase records are unchanged in the range, and the round read them at `99867698` in round 1. Round 1 carries these coordinates, and this round did not establish them again: the code under `apps/desktop/src/`, which the range does not touch; the three census searches of the acceptance rows; and the `from:` texts of *Rule changes*. Paths without a root are under `apps/desktop/`.

## Findings

### 1. The title's judgment takes `test:`, but the table its row cites gives `test:` to a change of nothing outside the tests, and this change alters the app

```seal
severity: should
location: `seal/threads/1795559732-test-start-raises-no-notification/frame/plan.md:63`, `seal/threads/1795559732-test-start-raises-no-notification/pr.md:3`
evidence: read `seal/threads/1795559732-test-start-raises-no-notification/frame/plan.md:24`, `seal/threads/1795559732-test-start-raises-no-notification/frame/plan.md:63`, `seal/threads/1795559732-test-start-raises-no-notification/changelog.md:1`, `seal/threads/1795559732-test-start-raises-no-notification/changelog.md:8`, `src/shared/ipc.ts:84`; the plugin's `skills/commit-pr-convention/SKILL.md` *Commit messages* and *Pull request titles*; executed `git grep -n -i notification 4a005eb -- docs/architecture.md docs/product.md docs/design.md`
regression: round-1#2
```

Why it matters: the row added at `frame/plan.md:63` decides the pull request's title, and the sealer reads that title against the diff. The row's grounds cite a source that gives a different answer. Round 1's finding 2 asked for the row and left its verdict to the orchestrator. The frame says the chosen design stops the notification "for a test's start and an agent's alike" (`frame/plan.md:24`) and adds a member to `OwleryApi`. The fix wrote that the change serves "the test start alone". The defect came from the row's grounds and not from the frame.

The row cites the plugin's `skills/commit-pr-convention/SKILL.md` *Pull request titles*, and that section takes "the same prefix vocabulary as the commits". The vocabulary's table under *Commit messages* has these rows and rules:

- `test:` is "nothing outside the repository's own tests".
- "A change's own tests and its work item's records never decide its prefix."
- "Where a change does more than one of these, its prefix is the one highest in the table."

This diff changes four files under `src/`, and each of the following happens outside the tests:

- A start with `OWLERY_BACKGROUND=1` no longer raises a system notification. An agent's own start of the app is such a start (`docs/architecture.md` *Measure before building*). The work item's own changelog is titled "an agent's run of the built app no longer raises a macOS notification over yours" (`changelog.md:1`).
- The preload's interface gains `background` (`src/shared/ipc.ts:84`), and `changelog.md:8` announces it "for a client of the app's preload".
- The rule changes add the notification to what `docs/architecture.md` *Screen framework: Electron* says a background start holds back.

So `test:` is not the table's answer.

The row's grounds also weigh two things the table does not weigh:

- It names "the prefix of issue #154's title" as grounds. The same skill runs the other way: "An issue's title takes the prefix the pull request that closes it will take", and the orchestrator retitles the issue where the two differ.
- It keeps `fix:` off because such a title "would tell a reader of the release note that a person's app changed". The table defines `fix:` by a rule the tree stated before the change, not by whose start changed.

At the base `4a005eb`, no sentence of `docs/` says that a background start raises no notification. The search above finds only line 474 of `docs/architecture.md`, "The window's page raises the notifications". So by *"Before the change" is the branch the change merges into*, `fix:` has no earlier rule to stand on. The highest row the change bears is `feat:`: something new to meet, a member of the preload and a new rule of what a background start does. The verdict stays the orchestrator's to write, and the sealer's to read.

The fix rewrites the row and its quote in `pr.md:3` together, since the quote must stay word for word. Where the prefix changes, the issue's title and the branch's `test/` prefix (`routing.md:10`) follow it as the skill says, or the row says why not.

```markdown
| 2026-11-25 | The pull request's title takes `feat:`, and the kind that came closest is `fix:`. | A start with `OWLERY_BACKGROUND=1`, an agent's as well as a test's (`frame/plan.md` *Alternatives considered*, the chosen row), raises no system notification after this change, and the preload gains `background`; both are met outside the repository's tests, so `test:` does not apply. `fix:` came closest, but no sentence of `docs/` at the base said a background start raises no notification, so the change states the rule rather than meets one. Issue #154 is retitled to match | the plugin's `skills/commit-pr-convention/SKILL.md` *Commit messages*, the table and the paragraphs on the highest row and on "before the change" |
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: the last case of `test/notification-click.test.ts` (lines 230-251) holds what round 1 found unpinned. It reloads the page, after it registers a counting stand-in for the new document. It reads `window.owlery.background` as true and a new, empty kept list (line 237). It then has Alpha's pane wait while the inbox is in front, and reads one kept entry and no construction of the system's (lines 248-250). The fix pass's reason for leaving round 1's snippet holds, read against `src/renderer/renderer.ts:112-113`. That snippet asserted only line 237, and a page that handed `false` to `chooseNotifier` still puts `kept` on `window`, so line 237 passes under that mutant. The case passes alone at `841c068e`, and its red with the main process answering `Channel.background` truly only once fails at line 237 as the close says (`## Probes`). The other half of the finding is also closed. `841c068e` points `frame/design.md:63` at this case by its name, which matches the case's name word for word. It says `test/screenshots.test.ts` holds nothing of the row, and *Scope* item 5 (`frame/design.md:42`) names the second case. Executed and read.

```seal
confirms: round-1#2
```
What holds: `frame/plan.md` *Judgments of the run* now holds a row on the title's prefix (`frame/plan.md:63`). `pr.md:3` quotes its *Judgment* cell word for word, under the coordinate `frame/plan.md` *Judgments of the run*, 2026-11-25. The finding as round 1 stated it, a missing row and a missing quote, is closed. The row's verdict is finding 1 of this round. Read.

```seal
confirms: round-1#3
```
What holds: `pr.md` no longer holds the `### Open rows` heading. The Q1 quote at `pr.md:10` carries the coordinate `frame/questions.md` Q1 alone, and its question still stands word for word at `frame/questions.md:13`. Every line of `pr.md` is now the `Part of` line, a quote with its coordinate, or the attribution line, whose emoji is U+1F916. Read, with the quote checked by `git grep -n -F` (executed).

What matched: the new case reads the same `recorded()` and `sessions()` helpers as the earlier cases, and it is the file's last case, so its reload ends nothing a later case reads. The `Page.enable` before `Page.addScriptToEvaluateOnNewDocument` follows the same pair at `test/theme-controls.test.ts:136-137`, with the same comment's claim. No test file outside the case changed, and no file under `src/` changed in the range (`git diff --stat a798da23..841c068e`, executed). Read.

The acceptance row at `frame/design.md:57` still names "The case of *Scope* item 5", and *Scope* item 5 now names two cases. The row's Given and When are the first case's, and both cases hold its count, so the coordinate leads to a case that holds the row either way. This is no finding.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The two other reds the close of round-1#1 names: the page handing `false` to `chooseNotifier`, which fails at line 248, and `chooseNotifier` also calling `system`, which fails at line 250. This round ran one red, as its prompt asked | `trail/rounds/round-1.md`, the close of finding 1 | carried as the fix pass's claims; the sealer, where it weighs them |
| Whether `Page.enable` is needed before `Page.addScriptToEvaluateOnNewDocument`, as the case's comment says. The case passes with it either way | `test/notification-click.test.ts:231-232` | nobody owes it; the next editor of the case |
| The full suite, the typecheck, and the whole of `test/notification-click.test.ts` at `841c068e`. This round ran the new case alone; the fix pass reports the file passing alone, 5 cases | `gaps.md` *Not verified* | the orchestrator's broad gate |
| Whether a person's start still shows the banner | `frame/questions.md` Q1 | the owner, at the release walk |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/notification-click.test.ts -t "tells a page loaded again"`, in `apps/desktop/` of a scratch clone at `841c068e`, after the wait for other suites | 1 case passed and 4 skipped, exit 0. The new case passes alone |
| The same command, with the clone's `src/main/main.ts` answering `Channel.background` with `background` at its first ask and `false` after it, then restored | 1 failed and 4 skipped, exit 1: `AssertionError: expected [ false, false, null ] to deeply equal [ true, true, +0 ]` at `test/notification-click.test.ts:237`, the red the close of round-1#1 names first. No pane had come to wait when it failed, and the counting stand-in stood in the new page, so nothing reached the screen. `git status` of the clone afterwards shows no change to a tracked file |

```seal
verdict: fixed 19d0f08e
answer: The orchestrator rewrote the row of `frame/plan.md` *Judgments of the run* in place: the title takes `feat:`, and `test:` came closest. The grounds now stand on the table of *Commit messages*: no sentence of `docs/` at the base says what a background start does with a notification, so `fix:` has no rule to stand on, and a change's own tests do not decide its prefix. `pr.md` quotes the new row. The branch is renamed to `feat/154-a-test-start-can-still-raise-a-macos-notification`, and `routing.md` names it; issue #154 is retitled `feat: a test start can still raise a macOS notification over the owner's screen`. The commit after `19d0f08e` corrects the row's coordinate for the quoted sentence to *Alternatives considered*.
```
