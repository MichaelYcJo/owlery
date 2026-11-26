# Phase 1: 1795610689-214-delete-dialog-lists-read-cleanly

## What this phase found

**The frame holds against the tree.** Every coordinate `frame/design.md` *Grounding* and `frame/plan.md` *Technical context* name was opened at `ab7a5730` before the build. That covers `LossSection` and `lossSections` in `view.ts`, `namedLines` and `lossParts` in `renderer.ts` with their two callers, the dialog list styles, the delete dialog's markup, and the three cases the frame names. `git grep` on the five old captions and on `lossSections`/`LossSection` found them only in `view.ts`, `renderer.ts`, `view.test.ts` and `work-item-menu.test.ts`. No document of `docs/` held them.

**The heads count through `view.ts`'s one `counted` helper.** `view.ts` already held `counted(count, one, many)`, "A count with its noun, one or many". The first build wrote a local copy inside `lossSections`. `seal mutate` refused a mutant on it because its text stood twice. The copy went in `679116a1`. Judged against `skills/core/SKILL.md` *The rule a mechanism is kept against*: a fact has one source.

**Departure: a row takes its height from `grid-auto-rows: var(--detail-line)` on the list alone.** *Data & interfaces* asked for `height: var(--detail-line)` on each row as well. Both declarations held the same fact, so a mutant on either one would survive. `6d1bb067` removed the row's `height`. Judged against the same rule.

**The lead keeps the class `.says`.** `#delete-says` gains a rule of its own, `font-size: var(--size-text); color: var(--ink)`. It keeps `.says` for the margin every dialog's note has. The id selector outranks `dialog .says`. *Data & interfaces* left either choice open.

**The rows reuse the view's `.hash` and `.path` classes.** `dialog .loss .hash` overrides the view's `--ink-faint` with `--ink-muted`, and `dialog .loss .path` overrides `--ink-muted` with `--ink`. The commit's subject takes its own rule, because the view's `.commit .subject` stands under `.commit`.

**The defaults of `frame/questions.md` were built as stated.** Q1 (a): the head names the branch and the folder, and its rows are the bare branch name and folder path. Q2 (a): the dialog as a whole scrolls the way every modal dialog does. Q3 (a): a path is cut to one line, and its tooltip holds the whole path.

**Q4: Chromium in Electron 45.3.3 snaps a scroll that a `scrollTop` assignment makes, and does so at once.** The probe built a `dialog` holding a `ul.loss` of 20 rows under the app's own stylesheet. The list's `clientHeight` read 260, and its `scroll-snap-type` read `y mandatory`. The assignment `scrollTop = 37` read back 26 in the same task and 26 a second later. `scrollBy({ top: 40, behavior: "instant" })` from 26 read back 78. A smooth `scrollTo({ top: 120 })` rested at 130 after 1.5 seconds. So a `scrollTop` assignment would also have served the case. The case scrolls with a wheel event sent through the Chrome DevTools Protocol (CDP), as the frame planned, and the answer changes no line of the build. The probe file `test/test_tmp_q4_snap.test.ts` ran twice: the runner's reporter swallowed the first run's `console.log`, and the second run wrote its result to the scratch directory. The probe file was removed before the phase closed (`executed`).

**Seen red** (contract rule 15, `executed`):
- The two rewritten cases of `view.test.ts` ("names the branch and the folder…" and "counts in each heading…") failed against `ab7a5730`'s `view.ts`, before `view.ts` changed.
- For the built-app cases, `ab7a5730`'s `view.ts`, `renderer.ts` and `index.html` were written over the committed tree with `git show`, three runs of `test/work-item-menu.test.ts` were made, and the three files were written back from HEAD. `git status` was clean afterwards. A failing case leaves the delete dialog open, and every case after it then fails on that open dialog, so each run left out the cases red before it:
  - The full file: the delete case failed at `lossIn("delete-loss")`, which received "Removed from disk" and "The branch owlery/doomed" where "The branch and the folder removed from disk" and "owlery/doomed" were expected.
  - With the delete case left out: the long list's case failed at its wait for "the heading that counts the twelve commits".
  - With both delete cases left out: the removal case failed at `lossIn("remove-losses")`, which received "Removed from disk".

**Mutation runs** (`seal mutate`, each `red`, `executed`):
- `view.ts`, against `view.test.ts -t "delete dialog says of a loss"`. Eight mutants: the commits head in the plural for one; the untracked, ignored and uncommitted heads in the plural for one; the head for a folder alone and the head for a branch alone each made the head for both; the commits head counting the commits listed in place of `commitCount`; a commit as one joined path.
- `index.html`, against `work-item-menu.test.ts --bail=1`. Nine mutants: `grid-auto-rows: auto`; `max-height` at 9.5 rows; `scroll-snap-type` removed; `scroll-snap-align` removed; the row's `subgrid` made `none`; the hash in `--ink-faint`; the subject at `white-space: normal`; the path in `--ink-muted`; the lead in `--ink-muted`.
- `renderer.ts`, against the same command. Three mutants: a commit row's `title` emptied; a path row's `title` emptied; the list's class made `named whole`.
- `seal mutate` prints a verdict per mutant and not the cases' output. Which case went red for each mutant was not read. The two snap mutants and the 9.5-row mutant can only be caught by the long list's case, since no other case reads a scroll or a list of more than ten rows.

**One mutant was not run, because the case cannot tell it apart.** It would make each row a grid of its own, `grid-template-columns: auto minmax(0, 1fr)`, in place of the list's shared column. Every short hash in the case's clone is seven characters, so both forms draw the same columns. `gaps.md` *Not verified* holds it.

**Constraints met while running.**
- `frame/plan.md`'s narrow command, `pnpm --filter @owlery/desktop run test -- test/view.test.ts`, does not narrow. pnpm hands `--` through, and Vitest reads the path after `--` as no filter, so the run started the whole suite. It was stopped by its task id within three minutes, and none of its processes stood afterwards. The narrow form is `node scripts/test-in-electron.mjs test/view.test.ts`, run in `apps/desktop`. Every run of this phase used that form.
- A file list held in a shell variable does not split under zsh (contract rule 21). The first attempt at the two red runs that left out cases swapped no file, and so ran green against the new code. The runs were made again with the paths written out.

**For phase 2.** The commits' head reads exactly "39 commits no other branch, no remote and no tag holds" where `commitCount` is 39. The test helper `lossIn` now answers each row as its parts, `[hash, subject]` or `[path]`. A list of ten rows or more is 260px tall in the default tokens.

**No unit was only renamed or moved.**
