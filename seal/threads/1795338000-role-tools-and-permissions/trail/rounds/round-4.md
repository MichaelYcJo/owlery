# Review round 4: 1795338000-role-tools-and-permissions

```seal
target: a7c10ee against origin/release/v0.0.2
```

This round reads what came after round 3's target `d0e3dde`, as the caller narrowed it: the base merge `1526f4e` of `1a1f9bb` (read through `git show --remerge-diff 1526f4e`), the framer's fold `f86f698`, Q6's answer `ddfe27e`, phase 3 (`3391471`, `ddff5d0`, `c64bfdb`, `7503545`, `5055205`, `f4f871b`, `d660f79`, `5bb0fbe`), the fold `52e2416` and `a7c10ee`. The base branch stands at `1a1f9bb`, which is the merge's second parent. Phases 1 and 2 were read by rounds 1 to 3 and are not reviewed again here, except where the merge touched their files.

The records read whole at `a7c10ee` are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md` and `changelog.md`. The work item holds no `pr.md` and no `pr.<lang>.md` yet. `trail/phases/phase-3.md` was read whole. `trail/phases/phase-1.md`, `trail/phases/phase-2.md` and `trail/rounds/round-1.md` to `round-3.md` were read for their coordinates. The round ran in a `git clone --no-local` of the worktree at `a7c10ee`, under the scratch directory `1795338000-role-tools-and-permissions/round-4/`.

Carried from rounds 1 to 3 and not established again: the path rule of `role-grants.ts`, the adapter's request and answer lines, and the rows of round 3's `## Not judged`. No earlier finding waits for an answer: round 3 raised none, and rounds 1 and 2's findings were confirmed by rounds 2 and 3.

## Findings

### 1. The frame says each named case was shown failing before its code was written, and the built-app case of `ask-section.test.ts` was committed before it ever ran

```seal
severity: should
location: `seal/threads/1795338000-role-tools-and-permissions/frame/design.md:130`, `seal/threads/1795338000-role-tools-and-permissions/frame/plan.md:66`, `seal/threads/1795338000-role-tools-and-permissions/trail/phases/phase-3.md:37`, `apps/desktop/test/ask-section.test.ts:164`
evidence: read `seal/threads/1795338000-role-tools-and-permissions/frame/design.md:130`, `frame/design.md:151-152`, `frame/plan.md:66`, `trail/phases/phase-3.md:35-43`, and the phase's outputs `ask-new-case.txt`, `mutate-work-item-view.txt`, `mutate-wiv-each.txt`, `mutate-renderer-each.txt` and `boundary-3.txt` in the scratch directory `1795338000-role-tools-and-permissions/phase-3/`; executed `git log --format='%h %ci %s' 1526f4e..HEAD` and `stat` of those outputs
```

Why it matters: the frame's acceptance line, `frame/design.md:130`, reads "Each case named below is shown failing before its code is written." Scenarios 18 and 19 (`frame/design.md:151-152`) name one case of `apps/desktop/test/ask-section.test.ts`. The sealer reads that line as a fact of the build, and contract rule 15 asks that a case be seen red "before it is committed as a case".

What the build claims and what was found:

- Claimed (`trail/phases/phase-3.md:37`): "The built-app case was not run against the code before it. The owner's rule runs built-app files once at the end. Its red is each guard's mutation below." Its next section opens "Mutation, after `ddff5d0`" (`phase-3.md:39`).
- Found: `ddff5d0`, which holds both the case and the code it pins, was committed at 03:01:55. The first run of the case, `ask-new-case.txt`, started at 03:03:52. The four mutants of `work-item-view.ts`, the one of `renderer.ts` and the boundary batch ran after that. So the case was committed before any run of it, green or red. The phase's own order put the commit before the batch. The owner's rule asks for one batch at the end of the phase and does not put the commit first. A run against the renderer of `1526f4e` would have been one more run in that same batch.
- Found: each of the five mutants is red on the line of the guard it breaks (`ask-section.test.ts:185`, `:218`, `:225` twice, `:230`). So the case does pin its guards, and the mutation of each guard is stronger evidence than a run against the old code. That run would fail at the first wait (`:185`, no notification), which names no guard. The defect is the frame's sentence and the missing judgment, not the case.
- `frame/plan.md:66`, as `52e2416` and `a7c10ee` folded it, reads "Scenarios 17, 18, 19 and 22 as cases, each seen red before its code, and the one built-app case". That cell does not say whether "each seen red before its code" covers the built-app case. No row of *Judgments of the run* records the departure.

The three cases of `test/view.test.ts` that `phase-3.md:35` sends to mutation did fail before their code, on "is not a function" (`red-view.txt`). So `design.md:130` holds for them as written. Their guard reds also came after the commit, and the fix below names that too.

The fix pass owes three statements: the acceptance line, the phase row, and the phase record's grounds. It also owes a row of *Judgments of the run*, which is the orchestrator's to write. The alternative is to run the case once against the renderer of `1526f4e` in the next batch of built-app runs. That run would show only that the case fails, which `:185` already shows by reading.

```markdown
frame/design.md:130, replaced whole:

Each case named below is shown failing before its code is written, but for the one case of `apps/desktop/test/ask-section.test.ts` that scenarios 18 and 19 name. That case starts the built app, was committed in `ddff5d0` before its first run, and is shown red by each guard it names taken out alone, in the phase's batch of built-app runs after that commit, each mutant failing on the line of the guard it breaks (`trail/phases/phase-3.md`, *Mutation*). The three cases of `test/view.test.ts` that fail before their code on a missing function are shown red on their guards in the same way.

frame/plan.md:66, the cell "Verified by" of phase 3, replaced whole:

Scenarios 17, 18, 19 and 22 as cases of `test/view.test.ts`, each seen red before its code, and the one built-app case of `test/ask-section.test.ts` that holds scenarios 18 and 19, seen red by each of its guards taken out alone after `ddff5d0` (*Judgments of the run*). Scenario 23 by the screenshot run at the close of the phase, whose files the phase commits

frame/plan.md, a row of *Judgments of the run*, the orchestrator's to write:

| 2026-11-23 | The built-app case of `test/ask-section.test.ts` was committed in `ddff5d0` before its first run, and its red is its five guards taken out one at a time after that commit, each red on its own line, in place of a run against the code before it. Accepted: a run against the renderer of `1526f4e` fails at its first wait and names no guard, and the owner's rule runs built-app files in one batch at the end of a phase | `trail/phases/phase-3.md` *Mutation*; review round 4 | contract rule 15; the owner's rule on built-app files |

trail/phases/phase-3.md:37, replaced whole:

**The built-app case was committed in `ddff5d0` before its first run, and was not run against the code before it.** Its red is each guard's mutation below, run in the phase's batch of built-app runs after that commit, each red on the line of the guard it breaks.
```

### 2. The judgment that dropped every decision from the screenshot scene rests on a mark that a record of applied or carried decisions does not raise

```seal
severity: should
location: `seal/threads/1795338000-role-tools-and-permissions/frame/plan.md:109`, `apps/desktop/src/renderer/view.ts:270-276`
evidence: read `seal/threads/1795338000-role-tools-and-permissions/frame/plan.md:109`, `apps/desktop/src/renderer/view.ts:270-276`, `apps/desktop/src/renderer/view.ts:301-311`, `apps/desktop/src/renderer/shared.ts:291-293`, `apps/desktop/test/view.test.ts:907-915`, `trail/phases/phase-3.md:24`; executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/view.test.ts test/screenshots.test.ts` in the clone's `apps/desktop`, which passes the case at `view.test.ts:907`
```

Why it matters: the last row of *Judgments of the run* (`frame/plan.md:109`) gives its grounds as "a record holding a decision the last look does not hold always marks its line (`view.ts#decisionMark`)". On that ground the orchestrator accepted a screenshot scene with no decision record anywhere. So no shot of this pull request shows #119's "Decided without asking" section, and #157's comment carries that section away too. The settle reads this row against what it cost. A ground the code contradicts leads the settle and #157 to a wrong reason.

What the code does: `decisionMark` (`view.ts:270-276`) counts a decision in state `decided` that the look does not hold, and a decision in state `reversed`. A decision in state `applied` or `carried` is counted by neither. The repository's own case says so: "an applied and a carried decision in neither count" (`view.test.ts:907`). It expects `""` for a record of one `applied` and one `carried` decision (`view.test.ts:915`), and it passes. `detail` still lists every decision of the record in the view (`shared.ts:291-293`, through `decisionLines`, `view.ts:301-311`). It lists a line of the record that was not read as well, and `decisionMark` does not read that line either. So a record of `applied` and `carried` decisions, with a block that is not read, marks no line and still shows the "Decided without asking" section in the view.

`trail/phases/phase-3.md:24` states the narrower fact, and it holds: the record of four decisions, one reversed, marks any line it is written under. The row widened it to every record.

This finding does not decide whether the scene should hold such a record. That is the orchestrator's, against `docs/design.md` *A pull request that changes the window carries its screenshots*. The fix below corrects the ground and records the choice that was not weighed. A fix that does put such a record into the view's work item changes `test/screenshots.test.ts`, the screenshot paragraph of both editions of `docs/design.md`, the last row of *Removes*, and the twelve shots. A fix pass that takes that road owes all of those.

```markdown
frame/plan.md:109, the cell "Judgment", replaced whole:

Giving the request's work item neither mark (`f4f871b`) left the screenshot run without a decision record or a failed setup anywhere in its scene. The record the run wrote held decisions in state `decided` and one `reversed`, and `view.ts#decisionMark` counts each of those, so it marks any line it is written under, and moving it would change another item's shots. A record whose decisions are `applied` or `carried` alone, with a block that is not read, marks no line (`view.test.ts`, the case "an applied and a carried decision in neither count") and still shows "Decided without asking" in the view (`shared.ts#detail`). It was not weighed when this row was first written. Accepted for this item: #119's and #155's committed screenshots stand in their own records, and the scene that shows both marks, a decision record and a failed setup is carried to #157, which changes the row they crowd
```

## Confirmations

What matched: the base merge `1526f4e` keeps both sides in each of its seven conflicts. Read: `git show --remerge-diff 1526f4e`. `WorkItem` holds `permissions` beside `decisions`, `questions`, `unread` and `setup` (`apps/desktop/src/shared/protocol.ts`). `CameLater` names `permissions` among the late fields, and `isWorkItem` and `lookOf` read and copy all five (`apps/desktop/src/daemon/last-look.ts`). `workItemOf` adds `permissions` before `...(this.recordsRead.get(item.id) ?? NO_RECORD)`, and `NO_RECORD` holds no `permissions`, so the record cannot overwrite the requests (`apps/desktop/src/daemon/daemon.ts`). The `ask` comment keeps this branch's wording, `runSetup` stays, and `package.json` keeps `role:refusal` beside `settle` and `screenshots`. The tests take `NO_RECORD` and `permissions: []` side by side.

What matched: the line. `inboxLine` gives `waiting` where `parkedWith` or a request holds (`apps/desktop/src/renderer/view.ts:153`). Every reader of a line's state goes through it: the inbox's groups and sentence, the sidebar (`sidebar.ts:181`, `:141`), the summary (`view.ts:839-848`), and the view's facts and strip (`work-item-view.ts:895-916`). The list was made by `git grep -n -e 'parkedWith(' -e 'inboxLine(' -e '"waiting"' -- src/renderer src/main`, so it is whole for the window. `lineText` says `permission` after a park's question and before a pane's text, with " (and n more)" (`view.ts:996-1004`). `list.ts:145` is the one reader of `says`, and it draws `permission` as it draws `state`. `lineSince` takes the earliest of the open questions' `since` and the requests' `at` (`view.ts:166-172`). Where a pane also waits, the age counts from the request and not from the pane's wait, as #119's park already does. Weighed and not raised. Executed: `test/view.test.ts` passes, with the new group at `view.test.ts:1132-1235`.

What matched: the notification. `permissionNotifications` gives "Needs you" for each request id the window held nowhere before. It gives none for a muted work item, or for the one in front of a focused window (`view.ts:436-441`). `takeLists` raises the park's and the request's notifications in one loop, with one click (`renderer.ts:1223-1229`). The claim that a daemon's restart cannot hide a new request behind an old id holds. `ready` replaces the lists with no notification (`renderer.ts:1428-1444`), and no request outlives the daemon.

What matched: the card and its keyboard. `showAskSection` returns where `headlessKey` equals `askDrawn`. Where it draws again, it focuses the button whose `data-answer` the focused button carried (`work-item-view.ts:669-709`). `headlessKey` is the JSON of the work item's id and the lines, so it changes only where something drawn changes (`view.ts:2142-2144`). Read, not run: the crafter's outputs show the built-app case green at `ddff5d0`, and each of its five mutants red on its guard's line (`mutate-wiv-each.txt`, `mutate-renderer-each.txt`). A redraw while a request's button is pressed can still drop that press, where another session of the same work item sends text. The daemon sends one `headless` per text event (`daemon.ts:1350-1353`), and the Claude adapter's text events are whole messages. Weighed and not raised.

What matched: principle 8 and the two editions. `3391471` writes the row "A call a headless session asks the person to allow", the typefaces bullet and the screenshot paragraph into `docs/design.md` and `docs/design.ko.md`. It was committed before `ddff5d0` draws the card. Read: each Korean sentence says what its English one says, the row's "Each button takes the ring" among them. Executed: each edition has 15 headings and 366 table rows, and `git grep -n -e '도장' -- docs README.md README.ko.md` prints nothing. The CSS of `#headless .permission` and `.call` (`index.html:416-419`) gives the card the said ground, `--said-edge-waiting` and `--radius-said`. It sets the call in `--font-mono` and `--ink-strong`, whole and selectable, and puts the two `quiet` buttons at the right foot. That is the form of the row.

What matched: the shots. All twelve files `f4f871b` commits were opened against `docs/design.md`, with the six inbox lines and the six view cards cut side by side. Each inbox line reads "Asks to use Bash: pnpm test -- redirect.test.ts" whole, under "Needs you". Each card has "Asks to use Bash", the command in the fixed-width face, and "Allow" and "Refuse" at its right foot. The edge is Night watch's yellow, Register's two rules on no ground, and Desk's card edge. Scenario 23 holds at `f4f871b`, and the `closed` row of `gaps.md` says so. The claim of `phase-3.md:29` on which work item each inbox preview shows was checked in Night watch dark and Register light alone, a sample.

What matched: the label of the suite is honest. The first row of `gaps.md` *Not verified* names each narrow run of phase 3, `ddff5d0`'s boundary batch and `f4f871b`'s run, and leaves the whole suite and the typecheck to the orchestrator. Read: `boundary-3.txt` shows 17 files, 16 passed and 1 skipped, 611 cases, exit 0. The 17 are `view`, `themes`, `screenshots` and the 14 other files the `app` project of `vitest.config.ts` selects. No `gaps.md` row left the file without the word `closed`. Read: `git diff d0e3dde a7c10ee -- seal/threads/1795338000-role-tools-and-permissions/gaps.md`.

One gap in a case, which opens no finding: the redraw step of the built-app case keeps the keyboard on the last button of the section, the second call's "Refuse" (`ask-section.test.ts:220-225`). So a restore that focused the last answer button drawn would pass it as well. The mutant that names the request alone was red. The headless line's words beside "Needs you" stay the session's own lowercase state ("failed", "working"), as *Data & interfaces* states (`frame/design.md:270`). That predates this work.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the typecheck and the broad gate at `a7c10ee`, among them every file that starts the built app. This round ran no built-app file: each claim on the card, the keyboard and the notification click was read from phase 3's outputs at `ddff5d0`, and `test/` has not changed since but for `screenshots.test.ts` | the repository | the orchestrator, by the broad gate |
| Carried from round 3, not established again: a file system that tells a composed name from a decomposed one, a hard link out of the worktree, what 2.1.330 puts in `input.file_path`, a change between the read of a path's links and the write, and a `permissionMode` key in a taken agent | `apps/desktop/src/daemon/role-grants.ts`, `apps/desktop/src/daemon/adapters/claude.ts`, `apps/desktop/role-bundle/agents/` | as round 3 names them |
| Q4: which commands 2.1.330 runs without asking in the mode `default` | `seal/threads/1795338000-role-tools-and-permissions/frame/questions.md` | #41's first real round |
| A session with no role on the real CLI, waiting for the person and answered in the view | `seal/threads/1795338000-role-tools-and-permissions/gaps.md` | the owner, as `gaps.md` names |

## Probes

| Command | Result |
|---|---|
| `git clone --no-local` of the worktree, checked out at `a7c10ee`, then `pnpm install --frozen-lockfile` in the clone | Exit 0 and exit 0 |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/view.test.ts test/screenshots.test.ts` in the clone's `apps/desktop` | Exit 0: 2 files, 440 cases passed and 1 skipped |
| For `docs/design.md` and every other English document, the headings and table rows counted beside the Korean edition's, and `git grep -n -e '도장' -- docs README.md README.ko.md` | No edition differs. The grep exits 1 and prints nothing |
| `ffmpeg` cuts of the six inbox lines and the six view cards from the twelve committed shots, into the scratch directory | Two images, opened and read above |
| `gh issue view 157 --json title,milestone,state,comments` | Open, `release: 0.0.3`. Its comment of 2026-11-22T18:20Z carries the scene with both marks, a decision record and a failed setup to #157 |
