# Review round 7: 1795797447-322-workflows-compose-around-iadd

```seal
target: 931bf332, fixes 750183d0..931bf332
```

This is a verifying round. It answers the three findings round 6 closed: finding 1 in `3f187a49`, and findings 2 and 3 in `2b2d3b74`, with the close commit `d788f2b5`. It also reviews three commits no finding named. `f597ad53` changes the approval line's spacing, the CSS comment at `index.html:165` and the approval line's row of `docs/design.md:472` in both editions. `45280c6c` and `931bf332` rewrite rows of `gaps.md`. The round read the branch's worktree at `931bf332` through a `git clone --no-local` of it in the round's scratch directory, and changed no file in the worktree but this record. `git fetch` showed the base `origin/release/v0.2.0` still at `a75f4581`, and the range holds no merge. No `seal/parity.json` is declared. `seal/config.json` sets `Record language` to English. The work item holds `changelog.md` and no `pr.md` or `pr.<lang>.md`.

The caller ordered searches, reading and viewing PNG files only. This round ran no case, no build and no built-app file, and no probe that executes code.

Read whole at the target: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `trail/rounds/round-6.md`. `trail/phases/` and `trail/rounds/round-1.md` to `round-5.md` were not opened. No commit of the range changes them, and round 6 carried their coordinates. Read whole in the code: every line the range adds or removes, in `approval-line.test.ts`, `index.html`, `docs/design.md`, `docs/design.ko.md`, `gaps.md` and `round-6.md`. Read in context: the approval line's rules and the mark's rules at `index.html:125-173`, the right column's rules at `index.html:476-500`, the `:root` tokens at `index.html:14-60`, each theme's `--font-ui` in `themes.css`, the place's row as `shared.ts:341-345` builds it, and the whole of `approval-line.test.ts:1-300`. Viewed, of the fix pass's 120 PNG files: `register-light-lapsed.png`, `night-watch-dark-finished.png`, `desk-light-view.png` and `register-dark-inbox.png`. The rest were not opened.

Carried from round 6 rather than established again: the reading that `8d37e899` and `383c958f` change no other text the page evaluates, and its tally of their word pairs. No commit of this range touches those lines.

## Findings

### 1. `2b2d3b74` took a row out of `gaps.md` `## Not verified` without the word `closed`

```seal
severity: should
location: `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:11`
evidence: executed `git diff --word-diff=plain 0e556f40 931bf332 -- seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md`; executed `git show 0e556f40:seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md`, which holds the row at its line 12; executed `git grep -n -F 'names no `apps/desktop/test/ledger.test.ts`' -- seal`, which prints `trail/rounds/round-1.md:105` and `trail/rounds/round-6.md:93` and no line of `gaps.md`; read `seal/threads/1795797447-322-workflows-compose-around-iadd/trail/rounds/round-6.md:89`, `seal/threads/1795797447-322-workflows-compose-around-iadd/trail/rounds/round-6.md:93`
regression: round-6#2
```

The unit is the `## Not verified` table of `gaps.md`, which `2b2d3b74` changed. At `0e556f40` the table held, at line 12, the row "The acceptance row "The product holds the seal's vocabulary only where this design keeps it" of `frame/design.md` names no `apps/desktop/test/ledger.test.ts` [...]", answered by "the orchestrator, before the last phase runs that search". At the target that row is gone, and no row that opens with `closed` stands in its place. The plan's phase rows and `frame/design.md` say nothing of the closing memo. The rule that governs it is the plugin's `skills/implement/SKILL.md` *4. The closing memo*: "An item is closed by marking it, never by deleting it", which the proofer reads in the memo's diff. Round 6's finding 2 asked to rewrite or remove one paragraph of `## Not done`. It said where that permission stopped (`round-6.md:89`): "It is a paragraph of `## Not done`, not a row of `## Not verified`." The fix pass found the same fact in this row, judged it closed by `152762de`, and removed it under the finding's permission (`round-6.md:93`). That is where the defect came from.

Why it matters: the item was closed, and the close holds. `frame/design.md:110` now names `ledger.test.ts:204` and `:206` and gives `chain.ts` and `chain.test.ts` the stored kinds, read. But a deleted row and a row that was answered make the same diff, so the inspector and `seal unverified` can no longer tell from the memo that the item was raised and answered. That is the distinction the rule keeps. The fix is to put the row back, marked.

```markdown
seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md, a row of `## Not verified` after line 11, the row on the screenshots of the view's right column at 488px:

| closed the acceptance row "The product holds the seal's vocabulary only where this design keeps it" of `frame/design.md` named no `apps/desktop/test/ledger.test.ts`, whose earlier line case holds `sealer` and `seal` as an earlier build stored them, and gave `chain.ts` and `chain.test.ts` the earlier trailer alone as their reason, though both also hold the stored kinds | `152762de` rewrote the row at `frame/design.md:110`, which names `ledger.test.ts:204` and `:206` and gives `chain.ts` and `chain.test.ts` the stored kinds; review round 6 read it |
```

### 2. The approval line's row of `docs/design.md`, in both editions, and the CSS comment at `index.html:165` say a place's spaces are narrower than the column's other spaces, which the column's own rules contradict

```seal
severity: should
location: `docs/design.md:472`, `docs/design.ko.md:472`, `apps/desktop/src/renderer/index.html:165`
evidence: executed `git grep -n -F "narrower than the column's other spaces" -- docs apps README.md`, which prints `apps/desktop/src/renderer/index.html:165` and `docs/design.md:472`; executed `git grep -n -F "단의 다른 간격보다 좁습니다" -- docs apps README.ko.md`, which prints `docs/design.ko.md:472`; read `apps/desktop/src/renderer/index.html:166-173`, `apps/desktop/src/renderer/index.html:479-497`
regression: round-6
```

The unit is the sentence `f597ad53` wrote into the approval line's row of `docs/design.md:472`, into its Korean edition, and into the comment at `index.html:165`. The frame says nothing of the approval line's spacing. It keeps the line's four places (`frame/design.md:85`), and the right column's width came from round 1's fix pass (`gaps.md:11`). The fix narrowed a place's sides and its row's gaps to `--space-2` so that the inspector's row fits beside the scroll bar. It then gave as their reason that they are "narrower than the column's other spaces". The rules of the same column do not bear that out. `--space-2` stands at the places' top margin (`index.html:166`), at the gap of the view's head (`:480`), at the padding of each fact (`:485`), at the padding of each commit (`:488`) and at the gap of each parked question (`:497`). A place's own gap between its row and its note is `--space-1` (`:167`), which is narrower still. So the defect came from the fix's own sentence and not from what it asked of the CSS. The fix pass's account at `gaps.md:35` says it read "the approval line's rules and the mark's rules around them in `index.html`" and "not the rest of the `<style>` block". The column's rules are in that rest.

Why it matters: `docs/design.md` is a policy document that the framer and the crafter read before they change the window. A reader who takes the sentence at its word sees `--space-2` as the approval line's exception. That reader may then widen a space of the column that already is `--space-2`, or narrow one that is not, to keep the rule true. The sentence also states a universal about the tree, which contract rule 19 asks a change not to write. The other clauses that `f597ad53` wrote hold against the CSS: the row holds the state's mark, the longest name and the inspection's place (`shared.ts:344`), the column's scroll bar takes its room beside them, and the place draws the inspection's place at `--icon` (`index.html:172`). Each of the three statements loses the comparison and keeps the token. The search on the words is a sample of the fact's statements under contract rules 12 and 19, since another wording of the comparison escapes it. `gaps.md:29` and the commit message of `f597ad53` say `--space-2` without the comparison.

```markdown
docs/design.md:472, in place of "So a place's sides and the gaps of its row are `--space-2`, narrower than the column's other spaces.":
So a place's sides and the gaps of its row are `--space-2`.

docs/design.ko.md:472, in place of "그래서 자리의 양옆과 그 줄의 간격은 `--space-2`로, 단의 다른 간격보다 좁습니다.":
그래서 자리의 양옆과 그 줄의 간격은 `--space-2`입니다.

apps/desktop/src/renderer/index.html:165, in the comment, in place of "So a place's sides and the gaps of its row are narrower than the column's other spaces.":
So a place's sides and the gaps of its row are `--space-2`.
```

Each edit changes text inside one table cell and adds no heading and no table row. So the counts of headings and table rows that the broad gate compares between the two editions stay the same.

## Confirmations

```seal
confirms: round-6#1
```
What holds: `approval-line.test.ts:215` reads `inspector: inspector ? [...] : null,` inside the object the page's script returns, as the finding's paste-ready fix wrote it, read. `3f187a49` changes that one line and nothing else, read in its diff. `gaps.md:28` now says that round 5's fix pass also dropped that key, that the page refused the script, and that `3f187a49` put it back. That replaces the clause "names, titles, comments and fixture words alone", which round 6 found false, read. The fix pass's runs of the file after the fix are its claims. This round ran no case.

```seal
confirms: round-6#2
```
What holds: the paragraph of `## Not done` that said the acceptance rows' lists were the orchestrator's to write is gone, as the finding allowed, read in the diff of `2b2d3b74`. `git grep -n -F "The rows' lists are a frame file's" -- seal` prints `trail/rounds/round-6.md:81` and `:93` alone, which are that round's own finding and close, executed. The same commit also removed a row of `## Not verified`. Finding 1 of this round holds that removal.

```seal
confirms: round-6#3
```
What holds: `gaps.md:47` now names `record-blocks.ts#brokenOptions` beside `brokenAt` and `BROKEN_ID` "before this pass", and it lists the senses the finding named. It also lists three more senses the fix pass found: a value that holds no space to break at, a rule that runs unbroken at `index.html:482`, and the chain whose crafter answers with a block the reader refuses at `chain.test.ts:2099`. Each was read at its line. The finding's two searches at the target print 50 and 73 lines, executed. Those are the counts that the fix pass gives for `3f187a49`, and `f597ad53` adds no line that holds the words. `git grep -n -w -e brokenAt -e BROKEN_ID -- apps` prints nothing (exit 1), executed. Of the first search's lines, those that also hold "inspect", "lapse" or "seal" were read. They are the note that breaks between its words (`index.html:165`, `approval-line.test.ts:270`), the two stored states `last-look.test.ts:232` and `:389` that the paragraph names, and a broken bundle copy (`workflow.test.ts:126`). None of them uses the word for a lapsed inspection.

What matched: `f597ad53` holds the rule the case at `approval-line.test.ts:271` asserts, in every state and in every theme, read. The rule is that the section and each place stay within the view's right column. The inspector's row is the state's icon, the name and the inspection's place (`shared.ts:344`). The icon is `--icon` (`index.html:125`). The inspection's place is now `--icon` in every state. `.place .mark` (`:172`) sets the width and the height. The place draws the line's form, the class `mark` without `drawn` (`shared.ts:176`), and no rule of that form for a state sets either (`:135`, `:144`, `:147-151`). The name is "Inspector" at `--size-text` in `--font-ui`. Each theme's `--font-ui` is the same list of families (`themes.css:25`, `:160`, `:279`, `:398`, `:517`, `:636`), and `--size-text`, `--icon` and the spaces stand in the page's `:root` (`index.html:14-38`), which no theme changes (`docs/design.md:80`). The box themes draw their edges as inset shadows (`themes.css:377-378`, `:496-497`), which take no room. So the row's width is the same in each state and each theme. The round worked the widths from the fix pass's measurements, read. The column is 488px less its 1px edge and two `--space-6` sides (`index.html:478-479`), so it is 455px, or 440px beside a 15px scroll bar. That gives a place 110px, the width the failure printed. The case reads a place's `scrollWidth`, which counts the start side and the row, against its `clientWidth`. That model gives the old failure exactly: 6px plus a row of 16, 6, 58.78, 6 and 18 is 110.78px, printed as 111 in 110. With the fix, 4px plus a row of 16, 4, 58.78, 4 and 16 is 102.78px against 110. So the case keeps about 7px. The row keeps about 3px inside the place's 102px between its sides. Without the scroll bar a place is about 113.75px. The inbox's preview is wider than the column (`register-dark-inbox.png`).

What matched: the viewed PNG files show the change. In `register-light-lapsed.png` the inspector's row stands on one line inside its box, with the inspection's place at the box's right side and "Inspection lapsed" broken between its words. `night-watch-dark-finished.png` and `desk-light-view.png` show the same row inside the column, beside the scroll bar. The other three places still read right. Each note starts under its name, since the note's start, `--icon` plus `--space-2` (`index.html:173`), equals the icon plus the row's new gap. Each joining rule still runs from the name to the place's side and stops short of the next place's mark.

What matched: the comment at `index.html:165` and the row of `docs/design.md:472`, in both editions, state what the CSS does in each clause but the one that finding 2 holds. That includes the inspection's place "at the size of an icon, `--icon`" (`:172`).

What matched: `45280c6c` and `931bf332` rewrite rows of `## Not verified` in place. Rows 28 and 33 still name each built-app file that was not run, and say which later run ran `approval-line.test.ts` and `screenshots.test.ts`. Row 29 is new and names the case's failure, its cause and what no run measured. Row 35 is new and states the fix pass's read of its range. No row other than finding 1's left the table, read in the word diff.

A case gap, with no finding: the case at `approval-line.test.ts:271` holds the fix only on a machine that shows scroll bars. With overlay scroll bars, a place is about 3.75px wider and the case passed before the fix too (`gaps.md:29`). The repository's broad gate runs on the owner's Mac, where the fix pass's run shows the bar. The comment at `approval-line.test.ts:270` says "Inspection lapsed" is wider than the inspector's place. With overlay scroll bars the note has about 85.75px. This round did not establish whether the words still break there.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at `931bf332`: the whole suite, the typecheck and the documents' editions. The suite is `unverified`, since this round ran no case, as the caller ordered | the repository's `Broad gate` key of `seal/config.json` | the orchestrator, in the broad gate it runs next |
| The fix pass's runs, read as its claims and not run again: `approval-line.test.ts` 7 of 7, `terminal-basics.test.ts` 40 of 40, `screenshots.test.ts` 7 passed and 1 skipped, the 120 PNG files, and the failure at `approval-line.test.ts:271` at `011f7298` and at `3f187a49` | `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:29` | the orchestrator, in its next batch of built-app cases |
| The approval line with overlay scroll bars after `f597ad53`, which no run measured. The widths worked above say a place is wider there | `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:29` | the orchestrator, who decides whether the case should force the bar |
| The line counts `seal range` wrote in `gaps.md:35`, and what the builder says it read | `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:35` | the orchestrator, who decides whether this round's read of the range stands in for it |
| The 116 PNG files this round did not open | the fix pass's `shots/` directory in the session's scratchpad | the orchestrator, who picks the shots the pull request carries |

## Probes

| Command | Result |
|---|---|
| `git grep -n -i -e broke -e breaks -e breaking -- apps/desktop/test apps/desktop/src` at `931bf332` | 50 lines |
| `git grep -n -i -w -e break -e breaking -e breaks -e unbroken -- apps/desktop/test apps/desktop/src` at `931bf332` | 73 lines |
| `git grep -n -w -e brokenAt -e BROKEN_ID -- apps` at `931bf332` | nothing, exit 1 |
| `git grep -n -F "narrower than the column's other spaces" -- docs apps README.md` and `git grep -n -F "단의 다른 간격보다 좁습니다" -- docs apps README.ko.md` | `index.html:165`, `docs/design.md:472` and `docs/design.ko.md:472` |
| `git grep -n -F "The rows' lists are a frame file's" -- seal` | `trail/rounds/round-6.md:81` and `:93` |
| `git grep -n -F 'names no `apps/desktop/test/ledger.test.ts`' -- seal` | `trail/rounds/round-1.md:105` and `trail/rounds/round-6.md:93`, and no line of `gaps.md` |
