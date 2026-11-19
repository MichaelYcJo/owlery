# Review round 4: 1795043695-inbox-first-window

```seal
target: ce52a19, fixes 7432f26..ce52a19
```

This is a verifying round. Its target is the diff `7432f26..ce52a19`: the orchestrator's fold of round 3's two scope questions (`6add830`), the fix pass over round 3 (`1363781`, `03b115e`, `94c0114`, `fb468ef`, `b3ee196`, `51c9041`, `571edfa`), round 3's close blocks (`772a7e0`) and the orchestrator's fold of the fix pass into the frame (`ce52a19`). The code reviewed is that diff alone, which touches `index.html`, `renderer.ts`, `sidebar.ts`, `theme.ts`, `themes.css` and `view.ts` under `apps/desktop/src/renderer/`, and `apps/desktop/test/themes.test.ts` and `test/view.test.ts`. The parts of `277eb35..7432f26` the diff does not touch were not reviewed again.

The work item's records were read whole at `ce52a19`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `guarantee.md`, `trail/gate.md` and `trail/rounds/round-3.md`. Rounds 1 and 2 were opened for their target lines alone, and no phase record was opened: round 3's coordinates were carried for them. No `pr.<lang>.md` stands, since `seal/config.json` names English for both language keys. The repository declares no `seal/parity.json`.

Facts carried from round 3 and not established again: where each finding's defect stood at `a0742bc`, the method each finding used to list its instances, and the drives of phases 8 and 9. Every verdict below is this round's own. The fix pass's account of its drive at `571edfa` (computed colours, a form that did not open, a notice that cleared) is a claim this round read and did not run, since the round launched no app.

The two findings are both located in the work item's records alone. Each is a sentence that the fix diff wrote and that the tree contradicts.

## Findings

### 1. `frame/plan.md` *Judgments of the run* row 23 names a section *Risks* that the plan does not have

```seal
severity: should
location: `seal/threads/1795043695-inbox-first-window/frame/plan.md:166`
evidence: executed `grep -n "^#" seal/threads/1795043695-inbox-first-window/frame/plan.md` and `grep -n -i risks seal/threads/1795043695-inbox-first-window/frame/plan.md`; read `seal/threads/1795043695-inbox-first-window/frame/plan.md:30-45`, `:166`
regression: round-3
```

Why it matters: the row added at `ce52a19` says "`plan.md` *Risks* takes round 3's replacement for the theme cases' reach". The plan's headings are *Technical context*, *Alternatives considered*, *Phases*, *Overlap with the release*, *Operational impact* and *Judgments of the run*, and the word "Risks" stands in the file on line 166 alone. The sentence round 3's finding 5 replaced is `frame/plan.md:40`, a bullet under *Technical context*, in the paragraph that opens "**The failure scenario of the chosen approach.**". A reader who follows the row's coordinate, such as the sealer reading what each judgment rests on, finds no such section. Round 3's finding 5 asked the orchestrator to fold its second block into `frame/plan.md:40`, and the fold did that word for word (see `## Confirmations`); the row that records the fold then named the section wrongly. The defect comes from the row's wording alone, not from the fold of the line.

```markdown
| 2026-11-19 | The frame states what the fix pass over round 3 built: `plan.md` *Technical context*, in the failure scenario of the chosen approach, takes round 3's replacement for the theme cases' reach, *Scope* item 13 *States of a control* names the controls in front that keep their ground under the pointer, item 7 opens the form after `ready` alone, and *Data & interfaces* names `sidebarTree`'s new arguments, `noticeWithout` and the seven new custom properties | The fix pass writes no line of the frame but its Status cell, and its hand-back named each sentence the code at `571edfa` no longer matches | `trail/rounds/round-3.md`, the close blocks of findings 1 to 5 |
```

The block replaces `frame/plan.md:166` whole. No other statement in the tree names the section: the grep printed that line alone.

```seal
verdict: fixed 6f16158
answer: The round's replacement block was applied word for word to `frame/plan.md:166`, which now names *Technical context* and its failure scenario of the chosen approach in place of *Risks*. No code changed.
```

### 2. `gaps.md` says the theme's notice stays until a later choice is saved or another notice replaces it, and a pane started or a work item created also clears it

```seal
severity: should
location: `seal/threads/1795043695-inbox-first-window/gaps.md:98`
evidence: executed `grep -n 'tell(' apps/desktop/src/renderer/*.ts`; read `apps/desktop/src/renderer/renderer.ts:212-228`, `:272-277`, `apps/desktop/src/renderer/sidebar.ts:75-89`, `seal/threads/1795043695-inbox-first-window/gaps.md:98`
regression: round-3#4
```

Why it matters: the unit is the line of `gaps.md` *Not done* that `fb468ef` rewrote for round 3's finding 4. It now says "The status line says so until a later choice is saved or another notice takes its place". `tell("")` empties the line in three more places: when the daemon answers `started` (`renderer.ts:214`), when it answers `workItemCreated` (`:220`), and when the socket opens (`:276`). `tell("")` sets the notice to the empty string, and `showStatus` (`sidebar.ts:86-89`) then shows "Daemon running…" with no notice. So after a failed save, starting a pane takes the notice away while `appearance.json` still holds the earlier theme. Round 3's finding 4 asked the fix pass for "The status line says so until a later choice is saved". The fix pass widened that to name a second end and left out the daemon's answers, which round 3's grounds had named at `renderer.ts:214` and `:220`. A reader of the line takes the notice to stand through a pane started, and it does not.

```markdown
- **A choice that could not be saved is not tried again.** The status line says so until a later choice is saved, another notice takes its place, or the daemon answers a pane started or a work item created, which empties the line. The window stays in the theme chosen, and the next window opens in the theme saved before.
```

The block replaces `gaps.md:98`. No other sentence in the tree says how long that notice stands: `git grep -n "could not be saved" -- seal apps` lists this line, the constant at `renderer.ts:309`, the case at `test/view.test.ts:816-819`, `trail/phases/phase-9.md:33` and round 3's text with its close. Phase 9's line says the notice is told and sets no end to it, and the phase record and the close are history, so they stay as they are.

```seal
verdict: fixed 6f16158
answer: The round's replacement block was applied word for word to `gaps.md:98`, which now says the notice also goes when the daemon answers a pane started or a work item created. No code changed.
```

## Confirmations

```seal
confirms: round-3#1
```
What holds: `#tabs .tab:not(.active):active` (`index.html:277`) weighs one id and three classes and beats `#tabs .tab:hover` (`:270`). So a tab that is not in front takes `--pressed` while it is pressed. `#tabs .tab .close:hover` and `:active` (`:278-279`) weigh one id and three classes. That beats `#tabs .tab .close` (`:274`), which weighs one id and two classes, and `#pane-bar button:hover` (`:265`), which weighs one id, one class and one element. The rules for the close control of the tab in front (`:280-281`) weigh one id and four classes, and they use the terminal's inks. `.line.selected:active` (`:232`) and `.side-item[aria-current]:active` (`:175`) each weigh three classes and come after the selected rule they override. The label of the tab in front has no press style, and `gaps.md:57` says so, as round 3 asked. The fix is wider than the finding: a selected line and the sidebar's item in front now also answer the press. That holds by the same cause, a later rule of equal weight, and `frame/design.md:143` and `gaps.md:57` now state it. Read; the computed values the close quotes come from the fix pass's drive and were not run here.

```seal
confirms: round-3#2
```
What holds: round 3's grep run again at `ce52a19` printed only `50%`, `0`, `none`, the sealed place's `url(...)` and two values made only of themed properties (`index.html:290`, `:320`) (executed). Both blocks of `themes.css` define the seven properties (`:80-81`, `:95-100`, `:168-169`, `:182-186`). No element redefines `--rule`, `--mark`, `--ground-side` or the `--seal-blank` tones (a grep over `index.html`, `themes.css` and the modules, executed). So the edges, now resolved on `:root`, have the values they had when each rule resolved them in place. `--space-1` is `2px` (`index.html:23`), so `--radius-mark: 2px` keeps the mark's corner. The new case "writes no shadow, no light, no gradient and no corner of its own in its style" (`test/themes.test.ts:134-150`) failed at `:149` with `border-radius: var(--space-1)` and `box-shadow: inset 0 0 0 1px var(--rule)` written back into `index.html`, and listed those two alone (executed, `## Probes`). The comment at `index.html:10`, the head of `themes.css` and `gaps.md:54` now say what holds.

```seal
confirms: round-3#3
```
What holds: `openWorkItemForm` returns before `ready` (`renderer.ts:162`). Its three callers are the sidebar's "+" (`sidebar.ts:57`), the folder's path (`sidebar.ts:63`) and N with the Command key (`renderer.ts:110`), which reaches it through `onCommandKey`. The control that adds a repository returns before `ready` (`sidebar.ts:60`), so the folder dialog does not open either. `held.ready` turns true at `ready` alone (`renderer.ts:192`). `gaps.md:82` equals round 3's first replacement block (a Python comparison, executed). `gaps.md:83` is round 3's second block with the two clauses the close names, and both clauses hold: `onCommandKey` reaches the guarded function, and `theme.ts` waits on nothing from the daemon. *Scope* item 7 (`frame/design.md:131`) now says the same (read).

```seal
confirms: round-3#4
```
What holds: the listener calls `actions.save(choice).then(actions.saved, actions.notSaved)` (`theme.ts:39`), and `renderer.ts:313` passes `untell` of the one text. `untell` (`sidebar.ts:82-84`) empties the line only where the notice is that text, through `noticeWithout` (`view.ts:300-302`). The case of `noticeWithout` failed at `test/view.test.ts:818` when the function was made to return the empty string always (executed, `## Probes`). The code's close holds. The line of `gaps.md` that the close rewrote is finding 2 above.

```seal
confirms: round-3#5
```
What holds: `gaps.md:55`, `frame/plan.md:40` and the docstring at `test/themes.test.ts:68` each equal round 3's replacement block for them, line for line (a Python comparison, executed). `FUNCTION`, `HEX` and `isRed` are unchanged in the fix diff, so the sentences still say what the cases read (read).

What matched, read against `frame/design.md` at `ce52a19` unless it says otherwise:

- `1363781`, the fold of round 3's two `## Not judged` rows: `sidebarTree(held.workItems, held.sessions, held.paneKinds, held.query, held.filter)` (`sidebar.ts:134`) narrows as `narrowed()` of `shared.ts:60-62` does, through `matchWorkItems(workItemEntries(...))`. So the sidebar and the list still hold the same work items. Each title is drawn by `marked` (`shared.ts:84-95`), the helper the list uses, inside the same `span` with the title's class. A repository counts the work items left (`view.ts:136`). This is *Scope* items 20 and 21 as `6add830` folded them (`frame/design.md:200`, `:205`) and *Data & interfaces* (`:292`). The two new cases failed at `test/view.test.ts:603` and `:617` when `sidebarTree` stopped narrowing (executed, `## Probes`). Each holds an input the group did not, a query and a state. `showSidebar` still computes `narrowed()` for the field's count (`sidebar.ts:120`), a second narrowing of the same list. It costs one more pass and says nothing wrong.
- `frame/plan.md:165`, row 22: `variant-3-night-desk-search.png` under `etcs/design/owlery-window-canvas/assets/` has the same SHA-256 as the copy under `etcs/design/polish-mockups/`, the folder *Grounding* names (executed, `6373d1a4…`). Opened as an image, it marks "sess" in the sidebar's titles and shows owlery at 3 while "Inbox" says 10, as the row says (read). The same picture shows `agenticseal` with a count of 0. *Scope* item 21 leaves such a repository out, and the code and its case do the same. The row does not cite the mockup for that point, so it is no finding.
- `frame/design.md:143`, `:315`, and `frame/plan.md:40` as folded at `ce52a19` match the code at HEAD (read). The row of `gaps.md` *Not verified* at `:8` lost the clause "a choice the main process cannot save", which the fix pass's drive covered by its account. That is a row reworded in place, not a row taken out.
- `pr.md`: each quote compared, whitespace collapsed, with the Judgment cell of the row it cites. Rows 8, 9, 10 and 1 match word for word, and rows 11 and 12 match as the leading parts of their cells (executed). The fix diff appended rows 22 and 23 and renumbered none.

The new cases were read against their groups: the two of `describe("sidebarTree")`, the one of `describe("noticeWithout")` and the one of `describe("the page")` in `test/themes.test.ts`. Each holds an input or a property its group does not already cover. The third assertion of the `noticeWithout` case, an empty notice, holds no fact the frame states and pins nothing a mutant of the other two would leave standing (`test/view.test.ts:819`). That is a gap in the case and no finding.

The suite's label: the crafter handed over with the broad gate unrun, and the label is honest. `trail/gate.md` names its newest run at `bc16b45`, and the fix diff changes code after that run, so the broad run is owed at HEAD and the orchestrator answers it. Both findings are located in the work item's records alone, so the code at `ce52a19` is the code the broad run will read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the typecheck and the documents' checks at the commit that closes this round | `seal/config.json` `Broad gate` | the orchestrator, by the broad run once the rounds settle |
| The computed colours and grounds that the fix pass's drive read at `571edfa`, and how the states of a control look by eye. This round launched no app | `seal/threads/1795043695-inbox-first-window/gaps.md:38` | the owner, at the built app or at the screenshots |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/view.test.ts test/themes.test.ts` in `apps/desktop` of the worktree, once | 2 files, 156 cases passed, exit 0. A narrow run of the two case files the fix diff changed, not the broad gate. Output kept at `<scratchpad>/1795043695-inbox-first-window/round-4/narrow.txt` |
| The same command in a `git clone --no-local` at `ce52a19` under `<scratchpad>/1795043695-inbox-first-window/round-4/clone`, once, with four edits made through the `Edit` tool: `border-radius: var(--space-1)` and `box-shadow: inset 0 0 0 1px var(--rule)` written back into `index.html`, `sidebarTree` reading `workItemEntries` without `matchWorkItems`, and `noticeWithout` returning `""` | 4 failed and 152 passed, exit 1: `test/themes.test.ts:149` listing the two declarations alone, `test/view.test.ts:603`, `:617` and `:818`. The edits were reverted with `git checkout -- apps/desktop/src` in the clone. Output kept at `<scratchpad>/1795043695-inbox-first-window/round-4/probe-mutants.txt`. No `test_tmp_*` file was written, and no file was added to the worktree but this record |
| `grep -n -o -E "(box-shadow\|border-radius\|filter\|background): [^;]*" apps/desktop/src/renderer/index.html`, filtered to values that are not one `var()` | round 3's finding 2 evidence, run again at `ce52a19`: only shapes, `none`, the sealed place's `url(...)` and two values made of themed properties |
