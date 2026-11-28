# Phase 2: 1795797447-322-workflows-compose-around-iadd

## What this phase found

**The frame holds.** I judged it against `frame/design.md` *Data & interfaces*, *The window's words* and *Stored state and the protocol*, and against `frame/questions.md` Q3 and Q4.

**The protocol.**
- `WorkItem.inspection` replaces `WorkItem.seal`. Its type is `Inspection`, with `state` `cleared` or `lapsed`.
- The inspection's record is `InspectionRecord`, whose field `judgedBy` is now `inspectedBy`.
- The daemon's file of verdicts, `inspection-records.ts#Inspection`, is now `InspectionFile`, so the two types do not share a name.
- *Stored state and the protocol* also asks `Repository.chain` to lose `plugin` and `chosen`, and `setRepository` to lose `paneChain`. Those are the chain choice, which *Scope* item 10 removes in phase 3, so they stay for now.

**"Back" stays the code's name for the sheet.** Only the window's words and the file names take "inspection sheet". The grounds:
- The pull request body's marker `<!-- owlery:back -->` stays, as phase 1 kept it.
- `Back`, `BackRound`, `BackFinding`, `composeBack`, `backShown`, `BACK_TAB` and the others hold no seal. Renaming them is about 150 sites of churn that no reader of the product meets.
- *Scope* item 7 asks for the window's words, and the acceptance search of `frame/design.md` reads "seal" alone.
- So the records type and its messages follow that name: `BackRecords`, `readBackRecords`, `backRecords`, `noBackRecords`.
- The modules and the three cases take the name the plan's phase 2 row asks for: `shared/inspection-sheet.ts`, `daemon/inspection-sheet-records.ts`, `test/inspection-sheet.test.ts`, `test/inspection-sheet-records.test.ts` and `test/inspection-sheet-view.test.ts`. The `check:` lines of `docs/architecture.md` and `docs/product.md`, and of their Korean editions, moved in the same commit.

**The window's words** follow *The window's words*:
- "Cleared" and "Cleared at <commit>".
- "Inspection lapsed" and "Inspection lapsed, cleared at <commit>".
- "No inspection yet".
- "Inspector" for the role, and "Inspector, verdict" for its stage and in the sheet's table of stages.
- "one step from its inspection".
- The summary's "2 cleared, 1 inspection lapsed".
- The tab "Inspection sheet", Q3's answer. The pull request body's section under it is headed `## Inspection sheet`.

Names the frame does not set:
- The sheet's line of the lapsing commit reads "Lapsed by" where it read "Broken by".
- The sheet's row "Judged by" reads "Inspected by".
- The view's note reads "An inspection binds to one commit and lapses if another lands after it."
- The value that says what changed since the look, `InspectionSince`, reads `cleared` or `lapsed` where it read `given` or `broke`.

**The mark keeps its drawing (Q4).** Its files moved from `assets/seals/` to `assets/marks/`, and `build.mjs` and the two links of `TRADEMARKS.md` moved with them.
- **Names in the page.** `.seal` is now `.mark`, `data-seal` is now `data-inspection`, and `#view-seal` and its parts are now `#view-inspection`.
- **Tokens.** `--seal-*` are now `--inspection-*`. `--mark` was already taken by the highlight, so it was not used. `themes.test.ts` holds both editions of `docs/design.md` to `themes.css`, so I renamed the token tables and the `--inspection-*` sentence at `docs/design.md:73` in the same commit. The Korean sentence takes Q2's words: 검수 표식, 검수 통과, 검수 실효.

**Q10: the stored look's reader takes a look an earlier build wrote.** `last-look.ts` checks and copies only the fields it names, so a work item whose reading stands under `seal` and no `inspection` reads as a work item with no inspection. The look itself is not refused. The new case in `last-look.test.ts` pins this with a look file in the earlier build's shape. I showed it red with `seal mutate`, adding a refusal of a `seal` key to the reader. Nothing was built for it.

**The daemon's state.** The run folder holds no inspection, because the daemon keeps the reading in memory (`daemon.ts#branches`). So nothing stored needed reading under the earlier names beyond the look.

**Found in the sample read of the range.** `inspection-sheet-view.test.ts` still expected "Broken by", and `daemon-restart.test.ts` still searched the run folder for the word `broken`. Both are built-app cases, fixed in `ba045723`.
