# Review round 2: 1795343000-background-window-unseen

```seal
target: cba0a24, fixes 27daa42..cba0a24
```

This is the verifying round of round 1. Its code bound is the diff `27daa42..cba0a24`: `4fa599c` and `6efb9e9` in `apps/desktop`, `304b2ac` in `apps/desktop/measurements/memory.md`, and the new frame of `cafb67e`, `dbe30c4` and `539e253`. The round worked in a `git clone --no-local` of the branch at `cba0a24`, in this round's scratch directory `1795343000-background-window-unseen/round-2/` under the session's scratchpad. The records read whole at `cba0a24` are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` and `trail/rounds/round-1.md`. No `pr.<lang>.md` stands, and `Commit and pull request language` is English. The work item has no `seal/parity.json`.

Carried from round 1 and not established again: the call order at `apps/desktop/src/main/background.ts:33-37`, the other paths that show a window under the switch (`main.ts:101`, `:139`, `:209-210`, `forward.ts:24`), and the probe outputs of the crafter's `phase-1/` scratch directory. Round 1 finding 3's executed line was run again (*Probes*). Everything else below was read or run at `cba0a24`.

The spawn named the unit files and no built-app file. That narrows the round's scope, and the round followed it (contract rule 3). The suite stays `unverified`, with the orchestrator as its answerer.

## Findings

### 1. Phase 2 of the plan holds a commit in its Status cell and has no phase record, so the sealer withholds

```seal
severity: must
location: `seal/threads/1795343000-background-window-unseen/frame/plan.md:39`, `seal/threads/1795343000-background-window-unseen/trail/phases/phase-2.md`, `seal/threads/1795343000-background-window-unseen/routing.md:18`, `seal/threads/1795343000-background-window-unseen/frame/design.md:5`
evidence: read `seal/threads/1795343000-background-window-unseen/frame/plan.md:36-41`, `seal/threads/1795343000-background-window-unseen/routing.md:18`, plugin `agents/sealer.md:95-98`, plugin `skills/implement/fix-pass.md:53`, plugin `skills/implement/SKILL.md:291`; executed `find seal/threads/1795343000-background-window-unseen -type f` (one file under `trail/phases/`, `phase-1.md`)
regression: round-1#1
```

Why it matters: the unit is `frame/plan.md` *Phases*, which `cafb67e` added as finding 1's fix and `539e253` filled. Row 2 reads "`frame/design.md` *Scope* items 2, 4 and 5, the fix pass of round 1", with the Status `304b2ac`. The frame made the fix pass of round 1 a phase of the plan. The crafter then ran it as a fix pass, which writes no phase record by plugin `skills/implement/fix-pass.md:53` ("A fix pass appends close blocks and writes no phase record"), and the defect comes from those two meeting. The sealer reads the plan the other way. Plugin `agents/sealer.md:95-98` says: "every phase of `frame/plan.md` whose Status cell holds a commit has its `trail/phases/phase-N.md`, and a declared party that left no record is a `withheld` reason naming the phase". `routing.md:8` declares `Implementation | crafter`, and `trail/phases/` holds `phase-1.md` alone. So the sealer withholds on phase 2 as the records stand. `routing.md:18` ("builds phase 2, the fix pass of round 1") and `frame/design.md:5` state the same framing.

Phase 2's Status names `304b2ac`, but `6efb9e9` came after it and delivers part of *Scope* item 2: the channel's comment at `apps/desktop/src/shared/ipc.ts:70`, which round 1 finding 2's close names. So the cell does not name the commit the phase closed at.

Two fixes close it, and the choice is the orchestrator's. The first keeps the plan as it is and gives phase 2 its record, from the plugin's `templates/records/sdd-phase.md`. The fix pass's own executed outputs in its `fix-1/` scratch directory give the facts. Write this as `trail/phases/phase-2.md`:

```markdown
# Phase 2: 1795343000-background-window-unseen

## What this phase found

**The phase was run as the fix pass of review round 1, and its closes stand in `trail/rounds/round-1.md`.** Its findings 1, 2 and 3 are this phase's *Scope* items 4, 2 and 5. Judged against `frame/design.md` *Scope* and round 1's paste-ready fixes, which were applied as written.

**The case of `chooseFolderDialog` was seen red with the background branch removed (executed).** With `if (background) return …` absent from the function, `pick-folder.test.ts` failed at `:31`: "expected '/r/project' to be null". `seal mutate` on the committed guard gave three mutants, three red and none survived (executed): the branch removed, the condition flipped, and the stand-in answering a folder.

**The sweep of the channel's statements found one more line.** `apps/desktop/src/shared/ipc.ts:70`, the comment of `OwleryApi.pickFolder`, said the call opens the native dialog, and it now says a background start opens none. The census was CENSUS NOT IN THE RECORDS (the fix pass names the search it ran, and calls it a sample).

**The files that start the built app were not run in this phase.** Each of them builds `src/main/main.ts`, whose handler of `Channel.pickFolder` this phase changed. No case clicks Browse. `gaps.md` names the orchestrator to answer them at the broad gate.
```

Then set phase 2's Status cell at `frame/plan.md:39` to `6efb9e9`. The second fix is the framer's: reframe `frame/plan.md` so that the fix pass of round 1 is not a row of *Phases*, and say in *Phases* that round 1's close blocks deliver *Scope* items 2, 4 and 5. That fix also owes `routing.md:18` and `frame/design.md:5`, which call the fix pass phase 2. The snippet above covers the first fix only, and leaves `routing.md:18` and `frame/design.md:5` standing, which stay true under it.

### 2. No case holds the handler's use of `chooseFolderDialog`, so dropping it from `main.ts` would bring the sheet back unnoticed

```seal
severity: should
location: `apps/desktop/src/main/main.ts:173`, `apps/desktop/test/work-item-form.test.ts`, `seal/threads/1795343000-background-window-unseen/frame/design.md:35`, `seal/threads/1795343000-background-window-unseen/frame/design.md:53`, `seal/threads/1795343000-background-window-unseen/frame/design.md:91`, `seal/threads/1795343000-background-window-unseen/frame/design.md:96`, `seal/threads/1795343000-background-window-unseen/gaps.md:10`
evidence: read `apps/desktop/src/main/main.ts:170-174`, `apps/desktop/test/pick-folder.test.ts:24-36`, `apps/desktop/test/terminal-basics.test.ts:459-460`, `apps/desktop/test/terminal-basics.test.ts:607-608`, `apps/desktop/test/built-app.ts:125-126`, `apps/desktop/test/built-app.ts:231-234`, `apps/desktop/build.mjs:14-19`, `docs/architecture.md:365-366`; executed `git grep -n -E "work-item-browse|pickFolder|Browse" -- apps/desktop/test docs README.md` (only `pick-folder.test.ts`, and a `getBackgroundColor` line of `theme-controls.test.ts`)
regression: round-1#2
```

Why it matters: the unit is the handler of `Channel.pickFolder` at `apps/desktop/src/main/main.ts:170-174`, which `4fa599c` changed. `frame/design.md:35` (*Scope* item 2) says the handler passes its sheet through `chooseFolderDialog`, and names one case, in `pick-folder.test.ts`, which holds the function's two branches. The fix built that case, as round 1's snippet gave it, and the defect comes from that snippet and the frame naming only the function's case. The behaviour the issue asks for is the handler's: under the switch, no sheet opens. Delete `chooseFolderDialog(background, …)` from `main.ts:173` and every case stays green. `pick-folder.test.ts` never reaches `main.ts`, and no case clicks Browse (the search on the evidence line). The next edit of that line can then bring the sheet back over the person's windows during an agent's run, which is the defect #148 fixes.

The tree already holds the clipboard stand-in's wiring this way. `terminal-basics.test.ts:607-608` reads the clipboard of the started app and expects it empty: "The clipboard of an app started in the background is its own". `docs/architecture.md:366` names `terminal-basics.test.ts` on the check line of the same rule that *Rule changes* extends. A case can hold the folder dialog's wiring without a sheet drawn on any run, red or green. It replaces the system's dialog in the main process before it asks, so a handler that opened the dialog gets a folder back and shows nothing. `main.ts` is bundled as CommonJS with `electron` external (`build.mjs:14-19`), so the handler reads `dialog.showOpenDialog` from the module object at each call.

Precondition, not verified by this round: Electron's `dialog.showOpenDialog` is a writable property of the object `require("electron").dialog` returns. Where it is not, this case cannot stand in this form, and the fix pass says so. The case goes last in the `describe` of `apps/desktop/test/work-item-form.test.ts`, which already starts the app under the switch and holds the form whose Browse button asks:

```ts
  it("answers Browse with no folder in the background, and opens no dialog", async () => {
    // The system's dialog is replaced in the main process, so a handler that opened it would answer a folder and draw no sheet on the screen.
    await app.evaluateMain(
      `(electron.dialog.showOpenDialog = async () => { globalThis.owleryDialogsOpened = (globalThis.owleryDialogsOpened ?? 0) + 1; return { canceled: false, filePaths: ["/r/project"] }; }, true)`,
    );
    expect(await app.evaluate<string | null>("window.owlery.pickFolder()")).toBeNull();
    expect(await app.evaluateMain<number>("globalThis.owleryDialogsOpened ?? 0")).toBe(0);
  });
```

It is seen red with `chooseFolderDialog(background, …)` taken out of `main.ts:173`: the stand-in answers `/r/project`, and the run draws no sheet. The snippet stops at the case. The fix pass owes `gaps.md:10`, whose "No case clicks Browse" the case makes false. The framer or the orchestrator owes the frame: `frame/design.md:35` and the acceptance row at `:53` name the new case beside the unit case, and the two `to` lines of the check-line operations at `:91` and `:96` add `apps/desktop/test/work-item-form.test.ts`. Where the orchestrator takes no built-app case, the fix pass says why, and `gaps.md:10` names who answers the unpinned line.

### 3. The frame's grounding misreports what its search for pinned sentences printed

```seal
severity: should
location: `seal/threads/1795343000-background-window-unseen/frame/design.md:27`
evidence: executed `git grep -n -F -e <each from of Rule changes> e6937ca -- . ':!seal/threads'` in the round's clone, through `test_tmp_from_grep.py`
regression: round-1#1
```

Why it matters: the unit is `frame/design.md` *Grounding*, which `cafb67e` added as finding 1's fix. Its row "No test pins a sentence *Rule changes* rewrites" says: "Executed at `e6937ca`: `git grep -n -F` on the `from` phrases, outside `seal/threads`, printed only `docs/architecture.md:365`, `:384`, `docs/design.md:487` and `apps/desktop/measurements/memory.md:37`". The frame's job was to ground the rule changes, and the defect comes from the row reporting the search wrongly. The eight `from` lines, grepped at `e6937ca` outside `seal/threads`, print other lines. The operations print `docs/architecture.md:384`, `docs/architecture.ko.md:384`, `docs/architecture.md:365`, `docs/architecture.ko.md:365`, `docs/design.md:487` and `docs/design.ko.md:487`. The two check-line operations each print `docs/architecture.md:366` and `docs/architecture.ko.md:366`. No `from` prints `memory.md:37`, whose line read "Such a start lacks four things", and the row leaves out every Korean edition and both check lines. The conclusion stands: no test file holds a `from`, and the chain check printed no pin notice for this design. But the row reports an executed search wrongly, and the sealer reads *Grounding* as evidence. Round 1 finding 3 was the same kind.

```markdown
| No test pins a sentence *Rule changes* rewrites | Executed at `e6937ca`: `git grep -n -F` on each `from`, outside `seal/threads`, printed only the policy lines the operations rewrite: `docs/architecture.md:365`, `:366` and `:384`, `docs/architecture.ko.md:365`, `:366` and `:384`, `docs/design.md:487` and `docs/design.ko.md:487`. No test file holds one |
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: the work item now has a frame, and its `## Rule changes` reaches the policy documents. `frame/design.md:65-106` holds eight `change` operations, and the plugin's `rule_changes.parse` read them with no error and no unread line. `apply_op` placed each in its document and section at `cba0a24` (executed, read-only, *Probes*). The operations carry round 1's two on *Measure before building*, the two on *Screen framework: Electron* that finding 2 owed, the two check lines, and the two on `docs/design.md:487` and its Korean edition. `docs/roadmap.md:29` stays out with its grounds at `frame/design.md:12` and `:43`, and the paragraph still reads as the frame says (read). `apps/desktop/measurements/memory.md:37` reads "lacks five things", the fifth "the window on the screen, which is drawn at opacity 0" (read). `routing.md:7` reads `Planning | framer`, and the frame's mark at `frame/design.md:119` names `framer`. `gaps.md` *Not done* reads "nothing", and `trail/phases/phase-1.md:43` no longer says the phase made no statement false (read). Findings 1 and 3 of this round stand on units this fix added, and the close holds beside them.

```seal
confirms: round-1#2
```
What holds: `chooseFolderDialog` at `apps/desktop/src/main/pick-folder.ts:24-27` answers `{ canceled: true, filePaths: [] }` in the background and returns the system's dialog otherwise. The handler at `main.ts:173` passes `background`, the module's `takeBackground(process.env)` of `main.ts:39`, and the comments at `main.ts:26`, `main.ts:171` and `ipc.ts:70` say so (read). `node scripts/test-in-electron.mjs test/pick-folder.test.ts test/background.test.ts` under `OWLERY_BACKGROUND=1` passed, 2 files and 19 tests (executed). With the background branch removed in the clone, the case failed at `pick-folder.test.ts:31` with "expected '/r/project' to be null", which matches the close's `seen red` claim (executed, then restored). The page does nothing on a null answer (`renderer.ts:1624-1630`, read). `changelog.md:1` and `:5`, and `pr.md:7`, now name the window and the folder dialog and claim no more. Finding 2 of this round stands on the handler this fix changed, and the close holds beside it.

```seal
confirms: round-1#3
```
What holds: `trail/phases/phase-1.md:27` reads 372 samples at `alpha=0 onscreen=1` and three at `alpha=1 onscreen=false`, each the first sample of its app. Round 1's executed line, run again over `watch.log` in the crafter's `phase-1/` scratch directory, printed 372 and 3, at the log's lines 1, 6 and 185, for pids 59272, 59723 and 89482 (executed).

What matched: the frame's coordinates at `e6937ca` hold at `cba0a24`, since the fix diff edited `main.ts` in place. `main.ts:37` and `:126` hold the comments *Scope* item 1 names, `main.ts:127` holds `show: !background`, and `main.ts:152` holds `if (background) showInBackground(win)`. `renderer.ts:1192` holds the `Notification`, and `screenshots.test.ts:210` the `Page.captureScreenshot` call. `chooseOpener`, `chooseFinder` and `chooseClipboard` stand at `links.ts:33`, `paths.ts:71` and `clipboard.ts:19`. `git grep -n setOpacity -- apps/desktop/src` printed `background.ts:33` and `:35` alone (executed). `seal/` holds no `follow-up.md`, `docs/README.md` does not exist, and no fragment holds `### Process changes` (executed). No other design under `seal/threads/` names a section *Rule changes* names (executed). Issue #148 has no comment, and its three *Done when* lines are the ones `pr.md` and the frame read (executed, `gh issue view 148`).

What matched: the overlap with #119 still holds at `cba0a24`. `feat/119-no-question-holds-an-agentic-run` stands at `d648fb3`, past the `fd1cb72` that `frame/plan.md:45` read, and `git merge-tree --write-tree` of `cba0a24` with it reported no conflict (executed, in the clone). Its `docs/design.md` keeps the `from` sentence this design rewrites (executed, its diff read).

What matched: the suite's label is honest. `gaps.md:10` names the files that start the built app, after the handler changed, for the orchestrator at the broad gate. `gaps.md:11` names a person's Browse click for the owner. No built-app case clicks Browse, so no built-app result rests on the handler (executed, the search of finding 2).

The new case in `pick-folder.test.ts` covers `chooseFolderDialog`, which no other case covers, and it was added in its own `describe` beside `pickFolder`'s cases (read). It duplicates nothing in its group.

The frame's mark at `frame/design.md:119` reads "before the build", while `frame/design.md:5` says the frame "was drawn after the build" of phase 1. The mark is the form's fixed spelling. `chain_check.py`'s `MARK_RE` reads it only as `Framed <date> by <who>, before the build.`, and the form has no spelling for a frame drawn after a phase was built. So the round opens no finding on it, and reports it (contract rule 18).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The typecheck, the full suite, and the files that start the built app at `cba0a24`, after the handler of `Channel.pickFolder` changed | `seal/threads/1795343000-background-window-unseen/gaps.md:7`, `seal/threads/1795343000-background-window-unseen/gaps.md:10` | the orchestrator, at the broad gate |
| A window at opacity 0 keeps drawing on GitHub's macOS runner and on another macOS than 26.6 | `seal/threads/1795343000-background-window-unseen/gaps.md:8` | the orchestrator, by the pull request's `check` run |
| A person's start draws and behaves as before, and its Browse button opens the system's dialog as a sheet | `seal/threads/1795343000-background-window-unseen/gaps.md:9`, `seal/threads/1795343000-background-window-unseen/gaps.md:11` | the owner |
| The system notifications a page under the switch raises, routed by round 1 as a follow-up. `seal/follow-up.md` does not exist, and no record names its home yet | `apps/desktop/src/renderer/renderer.ts:1192` | the orchestrator |
| The frame's mark has no spelling for a frame drawn after a phase was built | plugin `skills/code-review/scripts/chain_check.py`, `MARK_RE` | the orchestrator, for the plugin |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/pick-folder.test.ts test/background.test.ts` in the clone's `apps/desktop` | exit 0; 2 files, 19 tests passed |
| The same for `test/pick-folder.test.ts`, with `if (background) return …` removed from `chooseFolderDialog` in the clone, then restored with `git checkout` | exit 1; failed at `pick-folder.test.ts:31`, "expected '/r/project' to be null"; 1 failed, 3 passed |
| `python3 -I test_tmp_rule_changes.py <clone>`, which calls `rule_changes.parse(text, "docs")` and `apply_op` for each operation | 8 operations, no error, no unread line; each placed |
| `python3 -I test_tmp_from_grep.py <clone>`, which runs `git grep -n -F` on each `from` at `e6937ca` outside `seal/threads` | the six prose operations print their own lines in `docs/architecture.md`, `docs/architecture.ko.md`, `docs/design.md` and `docs/design.ko.md`; the two check-line operations print `docs/architecture.md:366` and `docs/architecture.ko.md:366`; nothing else |
| `git merge-tree --write-tree --name-only HEAD origin/feat/119-no-question-holds-an-agentic-run` in the clone | exit 0, a tree, no conflict |
| `awk '{print $5,$6,$7,$8}' watch.log \| sort \| uniq -c` and `grep -n "alpha=1" watch.log` in the crafter's `phase-1/` | 372 at `alpha=0 onscreen=1`, 3 at `alpha=1 onscreen=false`, at lines 1, 6 and 185 |
| `chain_check.py --baseline origin/release/v0.0.2 --root <the branch worktree> --worktree`, before the record | exit 0; no notice at `frame/design.md` of a pin or a copy |
