# Review round 1: 1795559732-test-start-raises-no-notification

```seal
target: 99867698 against release/v0.0.4
```

Round 1 reviewed the whole diff `4a005eb..99867698`. It read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` whole at `99867698`, then both phase records. No `pr.<lang>.md` stands, because `seal/config.json` names English for both language keys. `seal/parity.json` does not stand, and `seal/config.json` has no `Pact` key. No earlier round exists, so no fact was carried from one. Paths without a root are under `apps/desktop/`.

Axes walked: inputs, authorization, exclusions and boundaries, deliberate non-exclusions, response shape, error paths, state, concurrency and security, plus three of this change's own. The first is a page loaded again. The second is the order of the page's script against a case's `evaluate`. The third is a start made with `keepBackground`, which keeps the person's start.

## Findings

### 1. No case holds that a page loaded again learns of the background start, and the acceptance row that claims it names a run that reads no notification

```seal
severity: should
location: `seal/threads/1795559732-test-start-raises-no-notification/frame/design.md:63`, `apps/desktop/test/screenshots.test.ts:685`, `apps/desktop/test/notification-click.test.ts`
evidence: executed `git grep -n -E "__notifications|Notification|owlery.background|__constructed" HEAD -- apps/desktop/test/screenshots.test.ts` (prints nothing), `git grep -n -E "Page.reload|location.reload|Page.navigate" HEAD -- apps/desktop/test`, and the probe `test/test_tmp_reload.test.ts` of `## Probes`; read `src/main/main.ts:196-199`, `src/preload/preload.ts:10-13`
```

Why it matters: the diff changed how a page loaded again holds its notifications back. Before this work, `test/screenshots.test.ts` registered its own replacement of `Notification` for each new document. After it, the preload asks the main process again at each load (`src/preload/preload.ts:13`), and the main process answers each ask (`src/main/main.ts:197`). No case holds that second answer. A main process that answered only the first load would let a reloaded page in a background start put a macOS banner over the owner's screen, which is the defect of issue #154.

The frame claims a case holds it. `frame/design.md:63`, the row "A page loaded again still raises nothing", says its Then ("the page keeps it and constructs nothing") is verified by `pnpm run screenshots` passing. That run cannot fail on the Then. The search above shows that `test/screenshots.test.ts` reads no `__notifications`, no `Notification`, no constructor count and no `window.owlery.background`, before or after its reload at line 685. A reloaded page that raised a system banner would pass it. The file also starts the app only under `pnpm run screenshots`, so the default suite never reaches its reload. Five other built-app files reload the page (`test/daemon-restart.test.ts:119`, `test/keep-awake.test.ts:145`, `test/role-bundle.test.ts:452`, `test/terminal-basics.test.ts:206`, `test/theme-controls.test.ts:141`). None of them reads the background fact or the kept list after the reload.

This round's probe shows the fact holds at `99867698`, before and after a reload (`## Probes`). The finding is that no case pins it, and that the frame says one does. The phase-2 record's note that the reload comment of `test/screenshots.test.ts` "is where its *Removes* row says the replacement's work lands" is accurate, but a comment is no case.

The fix adds one case to `test/notification-click.test.ts`, after its last case, because a reload ends the counting stand-in of *Scope* item 5 that the earlier cases read. The fix pass shows it red with the main process answering `false` after its first answer, as contract rule 15 asks. It also owes the `Verifiable how` cell of `frame/design.md:63`, which is the orchestrator's to repoint, and the *Scope* item 1 sentence stays as it is.

```ts
  it("tells a page loaded again that the app started in the background, so that page keeps its notifications too", async () => {
    await app.evaluate(`window.__beforeReload = true`);
    await app.cdp("Page.reload");
    await app.until(`window.__beforeReload === undefined && ["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front of the page loaded again");
    expect(await app.evaluate(`[window.owlery.background, Array.isArray(window.__notifications), window.__notifications?.length]`)).toEqual([true, true, 0]);
  });
```

The `Verifiable how` cell of `frame/design.md:63`, in place of the sentence naming `pnpm run screenshots`:

```markdown
The last case of `test/notification-click.test.ts` reloads the page and reads `window.owlery.background` as true and `window.__notifications` as a new, empty list. The fact reaches the page from the preload at each load (*Scope* item 1)
```

```seal
verdict: fixed 1b9ab01e
answer: The last case of `apps/desktop/test/notification-click.test.ts` (lines 230-251) now reloads the page and reads `window.owlery.background` as true and `window.__notifications` as a new, empty list (line 237). It then makes Alpha's pane wait with the inbox in front, and reads one kept entry (lines 248-249) and no construction of the system's (line 250). The fix pass did not apply the paste-ready case as written. That case's one assertion is line 237, and line 237 passed under the mutant where the page hands `false` to `chooseNotifier`, so the case cannot fail on "the page keeps it and constructs nothing". The new document gets a counting stand-in before its first script runs (`Page.addScriptToEvaluateOnNewDocument`), so a mutant that raises is counted and never reaches the screen. Seen red three ways, each by `seal mutate` with `OWLERY_BACKGROUND=1` and the file run alone (executed). With the main process answering `Channel.background` truly only once, it fails at line 237 with `expected [ false, false, null ] to deeply equal [ true, true, +0 ]`. With the page handing `false` to `chooseNotifier`, it fails at line 248, "the window never showed a notification of the page loaded again". With `chooseNotifier` keeping the entry and also calling `system`, it fails at line 250 with `expected 1 to be +0`. The file passed alone, 5 cases, with the case at the same bytes as `1b9ab01e`. The other half stays open for the framer: the *Verifiable how* cell of `seal/threads/1795559732-test-start-raises-no-notification/frame/design.md:63` still names `pnpm run screenshots`, and the fix pass does not write the frame.
```

### 2. `frame/plan.md` *Judgments of the run* holds no row on the title's prefix, and `pr.md` quotes none

```seal
severity: should
location: `seal/threads/1795559732-test-start-raises-no-notification/frame/plan.md:59-63`, `seal/threads/1795559732-test-start-raises-no-notification/pr.md`
evidence: read `seal/threads/1795559732-test-start-raises-no-notification/frame/plan.md:59-63`, `seal/threads/1795559732-test-start-raises-no-notification/pr.md:1-13`, `seal/threads/1795559732-test-start-raises-no-notification/routing.md:10`; the plugin's `skills/commit-pr-convention/SKILL.md` *Pull request bodies*
```

Why it matters: the plugin's `skills/commit-pr-convention/SKILL.md` *Pull request bodies* says this: "Why the title takes its prefix, and the kind that came closest where one did, is one row of `frame/plan.md` *Judgments of the run*, which `pr.md` quotes. The orchestrator writes that row before it writes `pr.md`." At `99867698` the table at `frame/plan.md:61-63` holds only its header and one empty row, and `pr.md` quotes no such row.

The prefix is a judgment here and not a formality. The branch is `test/154-…` (`routing.md:10`), and a `test:` title says the change is to tests. Yet the diff changes four files under `src/`. It adds a module of the page (`src/renderer/notifier.ts`) and a member of the preload's interface (`src/shared/ipc.ts:84`). It also changes what an app started with `OWLERY_BACKGROUND=1` does, which `changelog.md:5` and `changelog.md:8` announce to a client of the preload. Whether `test` holds, or `fix` comes closest, is the row's to say, and the reader of the pull request meets the title before anything else.

The fix is the orchestrator's: a row in the table, then its quote in `pr.md`. The words of the row are the orchestrator's judgment, so the snippet gives its shape and not its verdict.

```markdown
| 2026-11-25 | The title takes `<prefix>:`; `<the other prefix>` came closest | <why: what the diff changes under `src/` and under `test/`, and what a reader of the title is told> | the plugin's `skills/commit-pr-convention/SKILL.md` *Pull request bodies*; `routing.md` *Branch* |
```

```seal
verdict: fixed 70d1dffc
answer: The orchestrator's commit `70d1dffc` fills the row of `frame/plan.md` *Judgments of the run*: the title takes `test:`, and `fix:` came closest, with grounds. It also quotes the row in `pr.md`, under its coordinate (`frame/plan.md` *Judgments of the run*, 2026-11-25). The fix pass read that diff and judged neither the row's words nor its verdict.
```

### 3. `pr.md` holds a heading and an annotation of the orchestrator's own, and the annotation names a home no record names

```seal
severity: should
location: `seal/threads/1795559732-test-start-raises-no-notification/pr.md:9`, `seal/threads/1795559732-test-start-raises-no-notification/pr.md:11`
evidence: executed `git grep -n -F "the owner's run at the release walk" HEAD -- seal/threads/1795559732-test-start-raises-no-notification` (prints `gaps.md:10` and `pr.md:11` only), `git grep -n "184" HEAD -- seal/threads/1795559732-test-start-raises-no-notification` (prints `pr.md:11` only), `gh issue view 184 --json title,state,milestone`; read `seal/threads/1795559732-test-start-raises-no-notification/frame/questions.md:13`
```

Why it matters: the plugin's `skills/code-review/orchestration.md` *Orchestrator: the pull request opens once the sealer seals* says what `pr.md` may hold. It holds no sentence of the orchestrator's own account, and "no heading or bold lead-in of the orchestrator's stands in it". It also says that a quote's coordinate is "the record's path, then the heading, row, finding or line that holds the sentence". Two places of `pr.md` break that form.

- `pr.md:9`, the heading `### Open rows`, is the orchestrator's own heading.
- `pr.md:11` gives the Q1 quote the coordinate `` (`frame/questions.md` Q1; open; the owner's run at the release walk, #184) ``. Everything after `Q1` is the orchestrator's account, not a coordinate. The words "the owner's run at the release walk" are not the Q1 row's: its *Who can answer* cell reads "a measurement: the owner's run of the app as it ships, at the release's walk" (`frame/questions.md:13`). The words stand at `gaps.md:10`, which the coordinate does not name. No record of the work item names issue #184 as where Q1 is answered. #184 is open in milestone `release: 0.0.4` and is titled as the hand walk of milestone 2, so the link may be right, but `pr.md` is the only place that states it.

The five quotes of `frame/design.md` *Scope* and the Q1 question itself match their coordinates word for word (*Confirmations*).

The fix is the orchestrator's. It drops the heading, and the Q1 line keeps the quote with its coordinate alone. Where the owner should see who answers Q1 before the fold, the line quotes the record that says so, at that record's coordinate. Where #184 is to carry the row, a record names it first.

```markdown
- "Does a person's start of the built app still show the macOS banner when a pane behind another comes to wait, and does a click on it bring the window forward and open the work item's view?" (`frame/questions.md` Q1)
- "the owner's run at the release walk (`frame/questions.md` Q1)" (`gaps.md` *Not verified*, the row of a person's start)
```

```seal
verdict: fixed 70d1dffc
answer: The orchestrator's commit `70d1dffc` removes the `### Open rows` heading from `pr.md`. The Q1 quote now carries its coordinate alone, (`frame/questions.md` Q1), without the annotation that named #184. The commit did not add the optional quote of `gaps.md`. The fix pass read that diff.
```

## Confirmations

What matched: `frame/design.md` *Scope* items 2 and 3 and *Data & interfaces* against the code. `chooseNotifier` keeps `{ title, body, onclick: null }`, pushes it onto `kept` and returns it in the background, and returns what `system` returned otherwise (`src/renderer/notifier.ts:34-45`). The types `Raised`, `Kept` and `Notifier` are the ones `frame/design.md:72-88` states. The page hands `window.owlery.background` and a `system` that constructs `Notification` (`src/renderer/renderer.ts:112`). It puts `kept` on `window.__notifications` only in the background (`src/renderer/renderer.ts:113`). Both places of `takeLists` call `notifier.raise` and set `onclick` on what it returns (`src/renderer/renderer.ts:1539`, `:1544`). Read.

What matched: a person's start keeps its notification. `raise` calls `system` first where `background` is false (`src/renderer/notifier.ts:38`), and the preload reads anything but `true` as a person's start (`src/preload/preload.ts:13`). The starts that pass `keepBackground` (`test/korean-input.test.ts:327`, `test/memory.ts:479`) read no `__notifications` (`git grep -n "__notifications" HEAD -- apps/desktop/test`, executed). Read, apart from that search. The banner on a person's screen stays Q1.

What matched: the main process registers `Channel.background` in the same `whenReady` block as `Channel.appearance`, before `createWindow()` (`src/main/main.ts:192-199`, `:225`). So the preload's first `sendSync` meets a handler. Read.

What matched: the stand-in of *Scope* item 5 is installed after `BuiltApp.start` returns, which phase 2 found can be before the page's script runs. It still counts the page's constructions, because the page's `system` names the global `Notification` at each call (`src/renderer/renderer.ts:112`) and not at load. Read.

What matched: the acceptance rows' searches at the target. Each was executed, at `HEAD`. `git grep -n 'window.Notification' -- apps/desktop` prints `test/notification-click.test.ts:83` alone. `git grep -n 'new Notification' -- apps/desktop/src` prints `src/renderer/renderer.ts:112` alone. `git grep -n '__notifications = ' -- apps/desktop` prints `src/renderer/renderer.ts:113` alone.

What matched: `test/notifier.test.ts` and `test/notification-click.test.ts` pass at `99867698`, 2 files and 7 cases, run in this round's clone (`## Probes`). The phase records' claim that no file under `src/` changed after phase 1 holds: `git diff --stat 426b32be..HEAD -- apps/desktop/src` prints nothing (executed). So phase 1's runs and this round's run read the same source.

What matched: each `from:` of `frame/design.md` *Rule changes* stands at `99867698`, once, in the file and section it names (`git grep -c -F` on each, executed). No other sentence of `docs/` states what a background start holds back, or that the page's `Notification` is replaced (`git grep -n -i notification HEAD -- docs README.md`, executed). The settle's rewrite therefore leaves no copy standing.

What matched: no comment under `apps/desktop/` still says a file replaces the page's `Notification` or records into a recorder of its own (`git grep -n -i -E "recorder|reaches the system|reach the system" HEAD -- apps/desktop`, executed; the hits are the keyboard recorder of `test/korean-pane.ts`). The heads of `src/main/main.ts`, `src/main/background.ts#startsInBackground` and `src/shared/ipc.ts` name the notification (*Scope* item 6). Read.

What matched: the five quotes of `pr.md:3-7` stand word for word at `frame/design.md:38-42`, and the Q1 question at `pr.md:11` stands word for word at `frame/questions.md:13` (`git grep -n -F` on each, executed). The `Part of` line is the form this repository's pull requests #174, #175 and #177 open with (`gh pr view`, executed).

What matched: `changelog.md` against the code. Six files replaced the page's `Notification`, three with a recorder and three with an empty class. Five now replace nothing, and the sixth counts constructions (`git diff 4a005eb..99867698 -- apps/desktop/test`). The page learns of the background start from its preload at each load, and `window.owlery` gains `background` (`src/shared/ipc.ts:84`). Read.

What matched: `gaps.md` is new in this range, so the diff removes no row of it. Its two `closed` rows name `23167047`, where phase 2's boundary run passed. Read. The coordinates phase 2 gives at the target hold: `test/approval-line.test.ts:256` reads the kept `Seal broken` entries, and `test/ask-section.test.ts:173` waits on `before + 2` (`git grep -n "__notifications"`, executed).

The count `test/ask-section.test.ts:155` takes before its requests holds nothing at this tree. Phase 2 shows a mutant that sets it to 0 surviving (`trail/phases/phase-2.md` *Reds*), and `frame/design.md` *Scope* item 4 calls it an arrangement that no acceptance row rests on, so it is no finding. In `test/notifier.test.ts`, the second case adds to the first only that the kept entry's `onclick` can be written: the first case already holds that `raise` returns the kept entry itself (`toBe`).

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a person's start still shows the macOS banner and opens the view at a click | `frame/questions.md` Q1 | the owner, at the release walk |
| The full suite, the repository-wide typecheck and the built-app files neither phase ran. The crafter's hand-off leaves them `unverified` with the orchestrator named, which is an honest label. This round ran two files narrowly | `gaps.md` *Not verified*, first row | the orchestrator's broad gate |
| The reds the phase records list, which this round read and did not run again | `trail/phases/phase-1.md` *Reds*, `trail/phases/phase-2.md` *Reds* | carried as the crafter's claims; the sealer, where it weighs them |
| `pnpm run screenshots` against a page loaded again under a mutant that tells it nothing. It was not run, because a page that raised under that mutant would put a banner over the owner's screen. Finding 1's case answers the same question without a banner | `test/screenshots.test.ts:685` | the fix pass of finding 1 |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/notifier.test.ts test/notification-click.test.ts`, in `apps/desktop/` of a clone at `99867698`, after the wait for other suites | 2 files passed, 7 cases passed, exit 0 |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_reload.test.ts`, in the same clone, run once after the wait. The probe starts the built app with no pane, reads `[window.owlery.background, Array.isArray(window.__notifications), window.__notifications.length]`, reloads the page with `Page.reload`, waits for a screen in front of the new document and reads the same three values. No pane starts, so neither load raises a notification | 1 case passed, exit 0: both reads equal `[true, true, 0]`. The page loaded again learns of the background start and puts a new kept list on `window`. The probe file stays in the round's scratch clone |
