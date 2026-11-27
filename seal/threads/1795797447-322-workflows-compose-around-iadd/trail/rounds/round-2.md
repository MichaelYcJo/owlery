# Review round 2: 1795797447-322-workflows-compose-around-iadd

```seal
target: 7622b959 against origin/release/v0.2.0
```

This round does two things: it answers the six findings round 1 closed, and it reviews phase 2, which no round had read. The round read a `git clone --no-local` of the repository checked out at `7622b959`, under the proofer's scratch directory, and never the branch's worktree. The base is `origin/release/v0.2.0` at `a75f4581`. No `seal/parity.json` is declared, so no parity comparison is owed. `seal/config.json` sets `Record language` and `Commit and pull request language` to English. The work item holds no `changelog.md`, `pr.md` or `pr.<lang>.md` at the target.

Carried from round 1 rather than searched again: the coordinates of the stored kinds (`apps/desktop/src/daemon/chain.ts:1165-1172`, `apps/desktop/src/daemon/ledger.ts:40-46`), of the heavy commands (`apps/desktop/src/daemon/records-place.ts:194-196`, `:253-258`), of #323's hand-over (`seal/threads/1795797648-323-the-rules-live-in-the-repository/gaps.md:21-22`), and the searches named on round 1's `evidence:` lines, which this round ran again. Every verdict below was reached at this target.

Read whole at the target: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `trail/phases/phase-1.md`, `trail/phases/phase-2.md` and `trail/rounds/round-1.md`. Read whole as diffs: the commits that closed round 1's findings (`f15f8503`, `fbd4a370`, `9fdab76b`, `7877a846`, `ba25c33e`), the two fix-pass commits no finding named (`7dd8b781`, `c64a6912`), `ba045723` and `0d37e087`, and the part of `208f374d` under `apps/desktop/src/` (2,503 lines as `git show -M` prints it with three lines of context) and under `docs/`, `TRADEMARKS.md` and `apps/desktop/build.mjs`. Sampled: the part of `208f374d` under `apps/desktop/test/` (3,570 lines). It was read whole for `last-look.test.ts`, `themes.test.ts`, `work-item-form.test.ts`, `theme-controls.test.ts` and `records-dialog.test.ts`. For every other test file it was read by search: a count of the `expect(` lines each file's diff removes and adds, equal in every file but `last-look.test.ts`, which gains the Q10 case, and the searches named on the findings' `evidence:` lines. The rest of the test diff is unread, and `## Not judged` names it. The caller's figure of about 25,000 lines for phase 2 was not reproduced: the diffs listed above print 6,768 lines.

The axes walked, beyond the table of `skills/code-review/SKILL.md`: the cascade of the page's style where a class name is reused, a stored look an earlier build wrote, the right column's width against the stage beside it, and the part of speech a mechanical rename gives a word that stood as a verb.

## Findings

### 1. The chain dialog says "One chain inspections a repository", and the built-app case that holds the dialog's words still expects "One chain seals a repository"

```seal
severity: should
location: `apps/desktop/src/renderer/index.html:951`, `apps/desktop/test/chain-choice.test.ts:133`, `apps/desktop/src/renderer/view.ts:683`, `apps/desktop/src/renderer/view.ts:3793`, `apps/desktop/test/approval-line.test.ts:227`, `apps/desktop/test/view.test.ts:1542`, `apps/desktop/test/view.test.ts:1607`, `apps/desktop/test/view.test.ts:1614`, `apps/desktop/test/view.test.ts:1634`, `apps/desktop/test/view.test.ts:1739`
evidence: executed `git show 208f374d | awk '/^diff --git/{f=$4} /^\+/ && tolower($0) ~ /inspections (a|an|in|and the)|verdict inspections|that inspections/ {print f}'`, `git grep -n -i -E 'inspections (a|an|in) |verdict inspections|that inspections|case inspections' -- apps`, and over the 24 test files that call `buildApp(` or name `BuiltApp`, `grep -n -E 'Sealed|Seal broken|No seal yet|Back of the seal|Sealer|\.seal\b|#view-seal|data-seal|dataset\.seal|sealed at|Broken by|from its seal|seals a repository|seal-says|seal-slot|preview-seal'`; read `apps/desktop/src/renderer/index.html:951`, `apps/desktop/test/chain-choice.test.ts:130-139`, `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:8`, `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:10`
```

Why it matters: *Scope* item 7 asks every word the window shows of a seal to take the words of *Data & interfaces*. Where "seals" stood as a verb, the rename wrote the noun "inspections" in its place. The chain dialog, which the window shows before a Claude Code pane opens in a repository whose Claude Code enables the AgenticSeal plugin, now reads "One chain inspections a repository, so a pane runs one of the two." (`index.html:951`). The built-app case `chain-choice.test.ts:133` holds the dialog's words with `toEqual` and still expects "One chain seals a repository", so that case fails at the target. Over the 24 built-app files, the search for each window word and selector phase 2 renamed printed that one line.

The records the orchestrator runs the batch from do not see it. `gaps.md:10` lists the built-app files phase 2 changed or whose window it changed, and does not name `chain-choice.test.ts`. `gaps.md:8` carries the file into the batch at the end of phase 2, where it fails on this line. That row also names `seal-back-view.test.ts`, the file's name at phase 1, which stands as `inspection-sheet-view.test.ts` since `208f374d`. Row 10 names the new file, so the batch still reaches it.

The same cause wrote "inspections" as a verb in the comments and case words the location lists. `frame/design.md` `## Removes` gives the dialog, `view.ts#asksChain` and `chain-choice.test.ts` to phase 3, so three of the places may leave with the chain choice. `view.ts:683` and the case words of `view.test.ts` and `approval-line.test.ts` stay. The searches are a sample under contract rules 12 and 19: they read the shapes "inspections" took as a verb, and another verb the rename turned into a noun escapes them. Each replacement, by its line:

```text
apps/desktop/src/renderer/index.html:951 and the expected string of apps/desktop/test/chain-choice.test.ts:133:
  This repository's check is Owlery's, and your Claude Code enables the AgenticSeal plugin here. One chain inspects a repository, so a pane runs one of the two.
apps/desktop/src/renderer/view.ts:3793:
   * answer. One chain inspects a repository, and the daemon launches such a pane
apps/desktop/src/renderer/view.ts:683:
      // Whether an inspection holds is the inspection the branch's head holds, and a verdict that clears in the worktree alone is no verdict.
apps/desktop/test/approval-line.test.ts:227:
  /** The second work item, whose branch the next case clears and the one after it lapses, and the commit its inspection names. */
apps/desktop/test/view.test.ts:1542:
  /** A work item's records with the frame, three round records, a gate's run and a last verdict that clears. */
apps/desktop/test/view.test.ts:1607, the end of the case's title:
  ..., and reads a verdict that clears in the worktree while the head holds no inspection as no verdict
apps/desktop/test/view.test.ts:1614:
    // The worktree's verdict clears and the head holds no inspection: the gate's run says the place, or nothing does. A daemon of an earlier build sends no inspection.
apps/desktop/test/view.test.ts:1634:
    // An open question marks the place over what the records say: the inspector waits on a question while its verdict clears.
apps/desktop/test/view.test.ts:1739:
    // The records of this work item hold a verdict that clears an earlier commit, and the failed gate stands over it.
```

Where phase 3 has removed the chain dialog, `asksChain` and `chain-choice.test.ts` before the fix pass runs, the first two replacements go with them.

### 2. The inspection's mark took the class `mark`, which a parked question's "Default" word already carried, so that word is now laid out as an 18px disc

```seal
severity: should
location: `apps/desktop/src/renderer/index.html:134`, `apps/desktop/src/renderer/index.html:505-506`, `apps/desktop/src/renderer/work-item-view.ts:1128`
evidence: executed `git show a75f4581:apps/desktop/src/renderer/index.html | grep -n -E '\.mark\b'`, which printed lines 505 and 506 alone, and `git grep -n -E 'option \.mark|\.option \.mark|"mark", option' -- apps`, which printed `index.html:505`, `index.html:506` and `work-item-view.ts:1128` and no test; read `apps/desktop/src/renderer/index.html:134-151`, `apps/desktop/src/renderer/index.html:500-506`, `apps/desktop/src/renderer/work-item-view.ts:1128`, `apps/desktop/src/renderer/view.ts:777`, `apps/desktop/src/renderer/view.ts:831`, `apps/desktop/src/renderer/shared.ts:116-121`, `apps/desktop/src/renderer/shared.ts:176`, `seal/threads/1795797447-322-workflows-compose-around-iadd/trail/phases/phase-2.md:36-37`
```

Why it matters: at the base the class `mark` belonged to one thing. `work-item-view.ts:1128` writes each option of a question the work item is parked with as `part("mark", option.mark)`, a span of class `mark`. It holds "Default" on the option taken where the person gives none (`view.ts:831`), and `#questions .option .mark` at `index.html:505` styles it. Phase 2 renamed `.seal` to `.mark` (`phase-2.md:36`). The rule at `index.html:134`, `.mark { position: relative; flex: none; display: block; box-sizing: border-box; width: var(--inspection-size-line); height: var(--inspection-size-line); border-radius: 50%; }`, now matches the option's span too. `#questions .option .mark` sets only `font-size` and `color`, so the span keeps `display: block` and a width and height of 18px. "Default" at 11px is wider than 18px, so the word runs out of its box past the option's last grid column. The phase record names the token `--mark` as taken (`phase-2.md:37`), and not the class. No case reads where the option's word stands. This is read from the cascade, and nothing was rendered.

Every built-app case that finds the inspection's place queries `.mark`, so the narrower repair renames the option's class. The case it owes belongs in `apps/desktop/test/decisions-and-questions.test.ts`, which answers a parked work item's questions in its view: the option's "Default" stands inside its option's row, and the row runs past nothing.

```ts
// apps/desktop/src/renderer/work-item-view.ts:1128, in the map over a question's options
choice(String(index), index === question.chosen, part("label", option.label), part("default", option.mark), part("implies", option.implies))
```

```css
/* apps/desktop/src/renderer/index.html:505-506 */
#questions .option .default { font-size: var(--size-caption); color: var(--ink-faint); }
#questions .option .default:empty { display: none; }
```

### 3. `frame/questions.md` keeps Q10 open, though phase 2 answered it and pinned the answer

```seal
severity: should
location: `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/questions.md:28`
evidence: read `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/questions.md:26-28`, `seal/threads/1795797447-322-workflows-compose-around-iadd/trail/phases/phase-2.md:39`, `apps/desktop/src/daemon/last-look.ts:100-131`, `apps/desktop/src/daemon/last-look.ts:156-198`, `apps/desktop/test/last-look.test.ts:385-394`; executed the narrow run of `last-look.test.ts` named in `

```seal
verdict: fixed acee1116
answer: frame/questions.md's Q10 Status cell now carries the round's paste-ready text, answered by the work in phase 2. The orchestrator made the repair, since the questions are a frame file.
```

## Probes`
```

Why it matters: Q10's answerer is "the work", and its default says phase 2 pins the scenario with a look file an earlier build wrote and records what it found in its phase record. Phase 2 did both. `phase-2.md:39` records that the reader takes such a look, and the case "reads a look a build before the rename to IADD wrote" (`last-look.test.ts:385-394`) pins it with `toStrictEqual`, which also fails if the reader carries `seal` across under the new key. The code agrees: `last-look.ts#isWorkItem` no longer reads `seal`, and `lookOf` copies the fields it names alone. The row's Status cell still reads `open`, beside Q8 and Q9, which are measurements phase 4 owes. A reader of the frame takes an open row as a question that still waits on its answerer, so this one sends the orchestrator and the inspector of this branch to a question that nobody owes. The frame is the orchestrator's to edit, as round 1's findings 2 and 6 were. The Status cell:

```markdown
answered 2026-11-28 by the work, in phase 2 (`trail/phases/phase-2.md`, the paragraph on Q10): the reader takes it. `last-look.ts` checks and copies only the fields it names, so a look whose work items hold `seal` and no `inspection` reads as one with no inspection, and the case of `last-look.test.ts` that reads a look a build before the rename to IADD wrote pins it. Nothing was built.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `EARLIER_KINDS` is a `ReadonlyMap` read with `.get` (`apps/desktop/src/daemon/chain.ts:1166`, `:1171`), read. The two cases the fix added, `chain.test.ts` "reads no chain whose stage names a kind no build stored, a member name of Object.prototype among them" and the `constructor` line of `ledger.test.ts`, passed at the target, executed. With the lookup put back to an object literal indexed by the value, both failed, the chain case on `constructor: expected true to be false` and the ledger case on one entry too many, executed in the probe of `## Probes`. The line was restored and `git status` showed no change to a tracked file.

```seal
confirms: round-1#2
```
What holds: Q12 stands at `frame/questions.md:30`, answered with the default, and the bullet *This repository's heavy commands* stands at `frame/plan.md:70`, read. The close's `location:` names both. The code is phase 3's by that answer, and `records-place.ts#readHeavyCommands` still reads `iadd/config.json` alone at the target, read. Phase 3's row of `frame/plan.md:48` does not name Q12, and its crafter reaches the work through Q12's default and the bullet.

```seal
confirms: round-1#3
```
What holds: the paragraphs of `trail/phases/phase-1.md:10` and `:12` are the round's two blocks, and `gaps.md:12` is its third, read. Each still states the code at the target: `chain.ts#refusalsText` writes the role in the row's second cell, and `renderer/view.ts#approvalPlaces` places an open question where `by` equals the role, read.

```seal
confirms: round-1#4
```
What holds: `apps/desktop/src/daemon/repository-file.ts:3` names `inspection.md` and `:5` names the root's one `README.md`, and the docstring at `apps/desktop/src/daemon/daemon.ts:4054-4060` names both builder trailers, read. The search of round 1's `evidence:` line, run again at the target, prints `claude-accounts.ts:70`, `daemon.ts:3158`, `records-place.ts:492`, `worktrees.ts:1277` and `pr-check/lib/optin.py:12`, each of which states another fact, as the close says, executed.

```seal
confirms: round-1#5
```
What holds: the sentence at `gaps.md:19` names the helpers, says the last phase's search greps `seal` and reaches no line that says guarantee alone, names the command that lists those lines, and leaves the choice to the orchestrator, read.

```seal
confirms: round-1#6
```
What holds: the row of `frame/plan.md:60` is the round's paste-ready row, word for word, read.

What matched: the window's words of *Data & interfaces*. "Cleared", "Cleared at" and the commit, "Inspection lapsed" and "Inspection lapsed, cleared at" and the commit, "No inspection yet", "Inspector" and "Inspector, verdict", "one step from its inspection", the summary's "2 cleared, 1 inspection lapsed", the notification "Inspection lapsed" and the tab "Inspection sheet" stand in `apps/desktop/src/renderer/view.ts` (`ROLE_NAME`, `STAGES`, `INSPECTION_LAPSED`, `CLEARED_LINE`, `inspectionShown`, `BACK_TAB`, `HEAVY_PLACE_SAYS`, `inspectionsCounted`, `lapseNotifications`), read in the whole diff. A search of the strings of `apps/desktop/src/renderer`, `apps/desktop/src/shared`, `inspection-state.ts` and `inspection-sheet-records.ts` for broken, broke, guarantee, sealer, judged by and was given printed nothing, executed. The lines of the renderer, the shared modules, the main process and the preload that still hold `seal` all name AgenticSeal, for the chain choice phase 3 removes, executed with `git grep -n -i 'seal'` over those four folders. Finding 1 is the one place where the words do not read one way.

What matched: *Stored state and the protocol* as phase 2 takes it. `WorkItem.inspection` replaces `WorkItem.seal`, with `Inspection.state` `cleared` or `lapsed` (`apps/desktop/src/shared/protocol.ts:322`, `:548-555`), read. `Repository.chain`'s `plugin` and `chosen` and `setRepository`'s `paneChain` stay for phase 3, as `phase-2.md:11` and `gaps.md:25` say. Q10's reader takes an earlier look and reads it as one that says nothing of the inspection: `changeOf` reads a side with no `inspection` with the other side's, so such a look reports no change of the inspection (`apps/desktop/src/renderer/view.ts`, `changeOf`), read, and `last-look.test.ts` passed, executed. Only the Status cell is stale, which is finding 3.

What matched: the decision to keep `Back*` for the sheet (`phase-2.md:13-18`). Its grounds hold: the names hold no seal word, so the acceptance search of `frame/design.md:110` does not print them, and the pull request body's markers `<!-- owlery:back -->` and `<!-- /owlery:back -->`, a form phase 1 kept (`apps/desktop/src/daemon/github.ts`, `BACK_OPEN`, `BACK_CLOSE`), carry the same name, so the code and the form agree. The rejected alternative of `frame/plan.md:28` rests on the seal's words in a search, which these names are not. One part was not kept but chosen anew: the protocol's `readSealRecords` and `sealRecords` and the type `SealRecords` became `readBackRecords`, `backRecords` and `BackRecords` in this phase, in the picture of a back that Q3 gave up for the window. That costs the release nothing a person or a check reads, so it is no finding. A later issue that renames the sheet's code can take it.

What matched: the `--inspection-*` tokens and the tables of `docs/design.md` and `docs/design.ko.md`. Each `--seal-*` row of both editions was renamed with its value unchanged, as was each property of `apps/desktop/src/renderer/themes.css` and the three sizes of the page's `:root`, read in the whole diff. The sentence at `docs/design.md:73` and its Korean twin name the inspection's mark, a cleared and a lapsed inspection, the Korean in Q2's words (검수 표식, 검수 통과, 검수 실효). `themes.test.ts` passed, executed, and it holds both editions to the style sheet and a red to the `--inspection-*` properties alone. The prose of the rows *The seal's place*, *The back of the seal* and *The approval line* keeps the window's earlier words, which `gaps.md:23` gives to phase 5.

What matched: Q3 and Q4. The tab reads "Inspection sheet" and the body's section is headed `## Inspection sheet` (`apps/desktop/src/daemon/github.ts#backSection`). The drawing is unchanged, its two files stand under `apps/desktop/assets/marks/`, and `apps/desktop/build.mjs` and the two links of `TRADEMARKS.md` name them there, read. Every `check:` path under `docs/`, `README.md` and `README.ko.md` resolves at the target, executed with a loop over `git grep -h -o 'check: .*'`.

What matched: the approval line's fix in `7dd8b781` keeps the rules of `docs/design.md`. The measure `--facts-width` stands once in the page (`apps/desktop/src/renderer/index.html:49`) and once in each edition's table of measures (`docs/design.md:121`, `docs/design.ko.md:121`), and nothing else states the old 420px, executed with `git grep -n -E '\b420\b|\b488\b|facts-width'`. Principle 8 asks a change of a form to change the document in the same pull request, and the row of each edition at line 472 gains the two sentences on the name on one line and the note that breaks between its words. Docs/design.md states no measure of the stage, so the 68px it loses breaks no rule. By the page's measures, read from `index.html`, the view's section is 488px less the column's 1px edge and the 32px of `#view-scroll`'s padding, so 455px. A place is a quarter of that, 113.75px, less 12px of its own padding. Its row holds the state's mark (16px, `--icon`), two gaps of 6px and the inspection's mark (18px, `--inspection-size-line`), which leaves the name 55.75px. At 420px it left 38.75px, and "Inspector" in the system's sans at 13px is wider than that, where "Sealer" was not. So the width the fix chose is close to the least that holds the form. One narrower repair existed: the place's padding and its row's gap, which no row of `docs/design.md` states, taken from `--space-3` to `--space-1`, give the name 54.75px at 420px. That leaves 2px between a role's name and the edges of Register's and Desk's boxes. `## Not judged` gives the choice between the two to the orchestrator. The widths here are worked from the measures. No rendered width was read, and the every-theme case of `approval-line.test.ts` is what settles them.

What matched: `c64a6912` and `ba045723`. The screenshot view is named `lapsed` in `apps/desktop/test/screenshots.ts#VIEWS` and in the run's map of `screenshots.test.ts`, and the two built-app cases read "Lapsed by" and the word `lapsed`, read. No document or script names a screenshot by the old name, executed with `git grep -n -E '"broken"|-broken|broken\.png|broken:'`.

A gap in a case, with no finding: the assertion `approval-line.test.ts:271` that `7dd8b781` adds holds the lapsed view within its column, and whether it fails with the note's `white-space: nowrap` back in place depends on the note's rendered width against its place. Neither commit nor record says it was shown red. `## Not judged` names it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at `7622b959`: the whole suite, the typecheck and the documents' editions. The suite is `unverified` | the repository's `Broad gate` key of `seal/config.json` | the orchestrator, in the broad gate it runs alone once the rounds settle |
| The built-app batch of `gaps.md:8`, `:10` and `:13`, and whether the assertion at `approval-line.test.ts:271` fails against the note's `white-space: nowrap`, which no record says was shown | `apps/desktop/test/` | the orchestrator, in the batch of built-app cases |
| Whether the stage's 68px is worth it over a place's padding and gap at `--space-1`, which keeps 420px at 2px from the boxes' edges | `apps/desktop/src/renderer/index.html:49`, `apps/desktop/src/renderer/index.html:167-169` | the orchestrator, from the screenshots `gaps.md:11` hands it |
| The screenshots of phase 2's window | `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:11` | the orchestrator, from the built app |
| The test diff of `208f374d` outside what the opening paragraph names as read, for whether each renamed assertion still pins what it pinned | `apps/desktop/test/` | the next round, where the orchestrator judges that a read is owed, and otherwise the broad gate for whether they pass |

## Probes

| Command | Result |
|---|---|
| `node node_modules/vitest/vitest.mjs run test/themes.test.ts test/last-look.test.ts test/inspection-sheet.test.ts --project unit`, in `apps/desktop/` of the clone at `7622b959`, with the main checkout's node modules linked into the clone | 3 files, 50 cases passed: a narrow run, and no gate |
| `node node_modules/vitest/vitest.mjs run test/chain.test.ts --project unit -t 'member name of Object.prototype'` and `node node_modules/vitest/vitest.mjs run test/ledger.test.ts --project unit`, in the same place | 1 case of `chain.test.ts` and the 13 cases of `ledger.test.ts` passed |
| The same two files with `-t 'member name of Object.prototype\|Ledger'`, after `chain.ts:1171` was edited to `({ seal: "inspection" } as Record<string, ChainStageKind>)[value]` | 2 failed: the chain case on `constructor: expected true to be false`, the ledger case on one entry too many. The line was then restored, and `git status --short` printed the two links of node modules alone |
